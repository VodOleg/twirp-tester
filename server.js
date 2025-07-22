const express = require('express');
const multer = require('multer');
const protobuf = require('protobufjs');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const { parseProtoContent, getOptionalFieldsMap } = require('./protoparser');

// Setup logging to both console and file
const logFile = path.join(__dirname, 'server.log');
function log(...args) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.join(' ')}`;
  console.log(message);
  
  // Append to log file (async, non-blocking)
  fs.appendFile(logFile, message + '\n').catch(err => {
    console.error('Failed to write to log file:', err);
  });
}

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize log file
log('Server starting...');

// Parse proto file with imports and generate JSON templates
app.post('/api/parse-proto', upload.array('protoFiles'), async (req, res) => {
  log('=== Proto parsing request received ===');
  log('Number of files uploaded:', req.files?.length || 0);
  
  try {
    // Find the main proto file (first one uploaded)
    const mainProtoFile = req.files[0];
    if (!mainProtoFile) {
      throw new Error('No proto file uploaded');
    }
    
    log(`Main proto file: ${mainProtoFile.originalname} (${mainProtoFile.size} bytes)`);
    
    // Read all uploaded files and prepare import map
    const uploadedFiles = new Map();
    
    // Read the main file first
    const mainContent = await fs.readFile(mainProtoFile.path, 'utf8');
    uploadedFiles.set(mainProtoFile.originalname, mainContent);
    
    // Read any additional uploaded files
    for (const file of req.files) {
      const content = await fs.readFile(file.path, 'utf8');
      uploadedFiles.set(file.originalname, content);
    }
    
    // Add common proto files from file system
    log('Adding common proto files...');
    const commonProtoFiles = [
      'imports/google/protobuf/timestamp.proto',
      'imports/google/protobuf/descriptor.proto',
      'imports/gett/api/annotations.proto'
    ];
    
    for (const protoPath of commonProtoFiles) {
      try {
        const fullPath = path.join(__dirname, protoPath);
        const commonContent = await fs.readFile(fullPath, 'utf8');
        uploadedFiles.set(protoPath, commonContent);
        log(`Added common proto: ${protoPath}`);
      } catch (err) {
        log(`Could not read common proto: ${protoPath} - ${err.message}`);
      }
    }
    
    // Use our improved protoparser to get the method map with import support
    log('Using protoparser to extract services and generate JSON templates...');
    const methodMap = await parseProtoContent(mainContent, uploadedFiles);
    
    // Extract optional fields for each method
    log('Extracting optional fields for each method...');
    const optionalFieldsMap = await getOptionalFieldsMap(mainContent, uploadedFiles);
    
    log(`Successfully extracted ${Object.keys(methodMap).length} methods with JSON templates`);
    log(`Successfully extracted optional fields for ${Object.keys(optionalFieldsMap).length} methods`);
    
    // Convert methodMap to the format expected by the frontend
    const services = {};
    
    // Since we now have the JSON templates, we still need to extract service information
    // for the frontend to know about services and method metadata
    const protoContentForServices = uploadedFiles.get(mainProtoFile.originalname);
    
    // Create a simple root just for service structure extraction
    const serviceRoot = new protobuf.Root();
    await protobuf.parse(protoContentForServices, serviceRoot, { keepCase: true });
    
    // Extract services and combine with JSON templates
    function extractServices(namespace, prefix = '') {
      for (const [name, nested] of Object.entries(namespace.nested || {})) {
        if (nested instanceof protobuf.Service) {
          log(`Found service: ${name} (${nested.fullName})`);
          services[name] = {
            name: name,
            fullName: nested.fullName,
            methods: {}
          };
          
          for (const [methodName, method] of Object.entries(nested.methods)) {
            log(`Found method: ${methodName}`);
            services[name].methods[methodName] = {
              name: methodName,
              requestType: method.requestType,
              responseType: method.responseType,
              jsonTemplate: methodMap[methodName] || {}, // Add the JSON template from our parser
              optionalFields: optionalFieldsMap[methodName] || [] // Add the optional fields list
            };
          }
        } else if (nested.nested) {
          extractServices(nested, prefix ? `${prefix}.${name}` : name);
        }
      }
    }
    
    extractServices(serviceRoot);
    log(`Total services found: ${Object.keys(services).length}`);
    
    // Clean up uploaded files
    log('Cleaning up uploaded files...');
    for (const file of req.files) {
      await fs.unlink(file.path).catch(() => {});
    }
    
    log('Sending response with JSON templates and optional fields...');
    
    const response = { 
      services, 
      methodTemplates: methodMap,
      optionalFields: optionalFieldsMap,
      success: true 
    };
    
    res.json(response);
    
  } catch (error) {
    log('Proto parsing error:', error.message);
    log('Error stack:', error.stack);
    
    // Clean up uploaded files on error
    for (const file of req.files || []) {
      await fs.unlink(file.path).catch(() => {});
    }
    
    res.status(400).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Make Twirp request from backend to avoid CORS issues
app.post('/api/twirp-request', async (req, res) => {
  try {
    const { baseUrl, serviceName, methodName, requestData } = req.body;
    
    if (!baseUrl || !serviceName || !methodName || !requestData) {
      throw new Error('Missing required fields: baseUrl, serviceName, methodName, requestData');
    }
    
    // Fix service name by removing leading dot if present
    const cleanServiceName = serviceName.startsWith('.') ? serviceName.substring(1) : serviceName;
    
    // Construct the Twirp URL
    const twirpUrl = `${baseUrl}/twirp/${cleanServiceName}/${methodName}`;
    
    log(`Making Twirp request to: ${twirpUrl}`);
    log(`Request data:`, JSON.stringify(requestData, null, 2));
    
    const response = await fetch(twirpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    const responseText = await response.text();
    log(`Response status: ${response.status}`);
    log(`Response text:`, responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { rawResponse: responseText };
    }
    
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      url: twirpUrl
    });
    
  } catch (error) {
    log('Twirp request error:', error.message);
    res.status(400).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Get message structure for form generation (DEPRECATED - now using JSON templates from protoparser)
app.post('/api/get-message-structure', async (req, res) => {
  try {
    const { messageType } = req.body;
    log(`Getting message structure for: ${messageType} (DEPRECATED - using JSON templates instead)`);
    
    // Since we now provide JSON templates directly in the /api/parse-proto response,
    // this endpoint is no longer needed. Return a success response to avoid errors.
    res.json({ 
      structure: [], 
      success: true,
      deprecated: true,
      message: "This endpoint is deprecated. JSON templates are now provided directly in /api/parse-proto response."
    });
    
  } catch (error) {
    log('Message structure error:', error.message);
    res.status(400).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add a logs endpoint to view logs from the browser
app.get('/logs', async (req, res) => {
  try {
    const logs = await fs.readFile(logFile, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs);
  } catch (err) {
    res.status(404).send('Log file not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(`Twirp Proto Tester server running on http://localhost:${PORT}`);
  log(`View logs at http://localhost:${PORT}/logs`);
});
