const protobuf = require('protobufjs');
const fs = require('fs').promises;
const path = require('path');

/**
 * Parse a proto file and return a map of service methods to their request JSON templates
 * @param {string} protoFilePath - Path to the proto file
 * @param {Map<string, string>} importFiles - Optional map of import file names to their content
 * @returns {Promise<Object>} Map where key = method name, value = empty JSON request object
 */
async function parseProtoFile(protoFilePath, importFiles = null) {
  try {
    console.log(`Parsing proto file: ${protoFilePath}`);
    
    // Read the proto file content
    const protoContent = await fs.readFile(protoFilePath, 'utf8');
    console.log(`Proto file read successfully (${protoContent.length} characters)`);
    
    return parseProtoContent(protoContent, importFiles);
    
  } catch (error) {
    console.error('Error parsing proto file:', error.message);
    throw error;
  }
}

/**
 * Parse proto content and return a map of service methods to their request JSON templates
 * @param {string} protoContent - The proto file content as string
 * @param {Map<string, string>} importFiles - Optional map of import file names to their content
 * @returns {Promise<Object>} Map where key = method name, value = empty JSON request object
 */
async function parseProtoContent(protoContent, importFiles = null) {
  try {
    console.log(`Parsing proto content (${protoContent.length} characters)`);
    
    // Create a new protobuf root
    const root = new protobuf.Root();
    
    // Add common google protobuf types
    root.define('google.protobuf').add(
      new protobuf.Type('Timestamp').add(
        new protobuf.Field('seconds', 1, 'int64'),
        new protobuf.Field('nanos', 2, 'int32')
      )
    );
    
    // Set up import resolution if importFiles are provided
    if (importFiles) {
      console.log(`Setting up import resolution for ${importFiles.size} files`);
      
      // Add a custom resolvePath function
      root.resolvePath = function(origin, target) {
        console.log(`Resolving: ${target} from ${origin}`);
        for (const [filename, content] of importFiles) {
          if (filename.endsWith(target) || filename === target) {
            console.log(`Found exact match: ${filename}`);
            return filename;
          }
        }
        console.log(`No match found for: ${target}, returning as-is`);
        return target;
      };
      
      // Custom fetch function to provide file contents
      root.fetch = function(filename) {
        console.log(`Fetching file: ${filename}`);
        const content = importFiles.get(filename);
        if (content) {
          console.log(`Found content for ${filename}`);
          return Promise.resolve(content);
        }
        
        // Try to find by basename or partial match
        for (const [key, value] of importFiles) {
          if (key.endsWith(filename) || path.basename(key) === path.basename(filename)) {
            console.log(`Found by basename: ${key} for ${filename}`);
            return Promise.resolve(value);
          }
        }
        
        console.log(`File not found: ${filename}`);
        return Promise.reject(new Error(`File not found: ${filename}`));
      };
    }
    
    // Parse the proto content
    await protobuf.parse(protoContent, root, { keepCase: true });
    console.log('Proto content parsed successfully');
    
    // Extract services and their methods
    const methodMap = {};
    
    function extractServices(namespace, prefix = '') {
      for (const [name, nested] of Object.entries(namespace.nested || {})) {
        if (nested instanceof protobuf.Service) {
          console.log(`Found service: ${name}`);
          
          // Process each method in the service
          for (const [methodName, method] of Object.entries(nested.methods)) {
            console.log(`  Processing method: ${methodName} -> ${method.requestType}`);
            
            try {
              // Find the request message type
              const requestType = root.lookupType(method.requestType);
              
              // Generate empty JSON template for the request
              const jsonTemplate = generateEmptyJsonTemplate(requestType);
              
              // Store in the map
              methodMap[methodName] = jsonTemplate;
              
            } catch (error) {
              console.error(`Error processing method ${methodName}:`, error.message);
              // Fallback to empty object
              methodMap[methodName] = {};
            }
          }
        } else if (nested.nested) {
          // Recursively check nested namespaces
          extractServices(nested, prefix ? `${prefix}.${name}` : name);
        }
      }
    }
    
    extractServices(root);
    
    console.log(`Extracted ${Object.keys(methodMap).length} methods:`, Object.keys(methodMap));
    return methodMap;
    
  } catch (error) {
    console.error('Error parsing proto content:', error.message);
    throw error;
  }
}

/**
 * Extract optional fields for each service method
 * @param {string} protoContent - The proto file content as string
 * @param {Map<string, string>} importFiles - Optional map of import file names to their content
 * @returns {Promise<Object>} Map where key = method name, value = array of optional field names
 */
async function getOptionalFieldsMap(protoContent, importFiles = null) {
  try {
    console.log(`Extracting optional fields from proto content (${protoContent.length} characters)`);
    
    // Create a new protobuf root
    const root = new protobuf.Root();
    
    // Add common google protobuf types
    root.define('google.protobuf').add(
      new protobuf.Type('Timestamp').add(
        new protobuf.Field('seconds', 1, 'int64'),
        new protobuf.Field('nanos', 2, 'int32')
      )
    );
    
    // Set up import resolution if importFiles are provided
    if (importFiles) {
      console.log(`Setting up import resolution for ${importFiles.size} files`);
      
      // Add a custom resolvePath function
      root.resolvePath = function(origin, target) {
        console.log(`Resolving: ${target} from ${origin}`);
        for (const [filename, content] of importFiles) {
          if (filename.endsWith(target) || filename === target) {
            console.log(`Found exact match: ${filename}`);
            return filename;
          }
        }
        console.log(`No match found for: ${target}, returning as-is`);
        return target;
      };
      
      // Custom fetch function to provide file contents
      root.fetch = function(filename) {
        console.log(`Fetching file: ${filename}`);
        const content = importFiles.get(filename);
        if (content) {
          console.log(`Found content for ${filename}`);
          return Promise.resolve(content);
        }
        
        // Try to find by basename or partial match
        for (const [key, value] of importFiles) {
          if (key.endsWith(filename) || path.basename(key) === path.basename(filename)) {
            console.log(`Found by basename: ${key} for ${filename}`);
            return Promise.resolve(value);
          }
        }
        
        console.log(`File not found: ${filename}`);
        return Promise.reject(new Error(`File not found: ${filename}`));
      };
    }
    
    // Parse the proto content
    await protobuf.parse(protoContent, root, { keepCase: true });
    console.log('Proto content parsed successfully for optional fields extraction');
    
    // Extract explicit optional fields from proto content using text parsing
    const explicitOptionalFields = parseExplicitOptionalFields(protoContent);
    
    // Extract optional fields for each method
    const optionalFieldsMap = {};
    
    function extractOptionalFields(namespace, prefix = '') {
      for (const [name, nested] of Object.entries(namespace.nested || {})) {
        if (nested instanceof protobuf.Service) {
          console.log(`Found service: ${name} - extracting optional fields`);
          
          // Process each method in the service
          for (const [methodName, method] of Object.entries(nested.methods)) {
            console.log(`  Processing method: ${methodName} -> ${method.requestType}`);
            
            try {
              // Find the request message type
              const requestType = root.lookupType(method.requestType);
              
              // Extract optional fields from the request type
              const optionalFields = getOptionalFieldsFromTypeWithExplicit(requestType, explicitOptionalFields);
              
              // Store in the map
              optionalFieldsMap[methodName] = optionalFields;
              
              console.log(`    Optional fields for ${methodName}:`, optionalFields);
              
            } catch (error) {
              console.error(`Error processing method ${methodName}:`, error.message);
              // Fallback to empty array
              optionalFieldsMap[methodName] = [];
            }
          }
        } else if (nested.nested) {
          // Recursively check nested namespaces
          extractOptionalFields(nested, prefix ? `${prefix}.${name}` : name);
        }
      }
    }
    
    extractOptionalFields(root);
    
    console.log(`Extracted optional fields for ${Object.keys(optionalFieldsMap).length} methods`);
    return optionalFieldsMap;
    
  } catch (error) {
    console.error('Error extracting optional fields:', error.message);
    throw error;
  }
}

/**
 * Parse proto content to find fields with explicit 'optional' keyword
 * @param {string} protoContent - The proto file content
 * @returns {Set<string>} Set of field paths that have explicit optional keyword
 */
function parseExplicitOptionalFields(protoContent) {
  const explicitOptionalFields = new Set();
  const lines = protoContent.split('\n');
  
  let messageStack = [];
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine === '') continue;
    
    // Track message declarations
    const messageMatch = trimmedLine.match(/^\s*message\s+(\w+)/);
    if (messageMatch) {
      const messageName = messageMatch[1];
      messageStack.push(messageName);
      console.log(`Entering message: ${messageStack.join('.')}`);
    }
    
    // Track braces to know when we exit messages
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // If we have closing braces and we're exiting a message
    if (closeBraces > 0 && messageStack.length > 0) {
      for (let j = 0; j < closeBraces; j++) {
        if (messageStack.length > 0) {
          const exitedMessage = messageStack.pop();
          console.log(`Exiting message: ${exitedMessage}, remaining stack: ${messageStack.join('.')}`);
        }
      }
    }
    
    // Find lines with explicit optional keyword
    if (trimmedLine.startsWith('optional ')) {
      const fieldMatch = trimmedLine.match(/optional\s+[\w.]+\s+(\w+)\s*=/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fullPath = messageStack.length > 0 ? `${messageStack.join('.')}.${fieldName}` : fieldName;
        explicitOptionalFields.add(fullPath);
        console.log(`Found explicit optional field: ${fullPath}`);
      }
    }
  }
  
  return explicitOptionalFields;
}

/**
 * Extract optional field names from a protobuf message type using both protobuf metadata and explicit parsing
 * @param {protobuf.Type} messageType - The protobuf message type
 * @param {Set<string>} explicitOptionalFields - Set of explicitly optional field paths
 * @returns {Array<string>} Array of optional field names (including nested paths)
 */
function getOptionalFieldsFromTypeWithExplicit(messageType, explicitOptionalFields) {
  const optionalFields = [];
  
  function extractOptionalFieldsRecursive(type, fieldPrefix = '', typePrefix = '') {
    for (const field of type.fieldsArray) {
      const fieldPath = fieldPrefix ? `${fieldPrefix}.${field.name}` : field.name;
      const typePath = typePrefix ? `${typePrefix}.${type.name}.${field.name}` : `${type.name}.${field.name}`;
      
      // Check if this field path is in our explicit optional fields set
      if (explicitOptionalFields.has(typePath)) {
        optionalFields.push(fieldPath);
      }
      
      // If this field is a message type, recursively check its fields
      try {
        if (field.resolvedType && field.resolvedType instanceof protobuf.Type) {
          extractOptionalFieldsRecursive(field.resolvedType, fieldPath, typePrefix ? `${typePrefix}.${type.name}` : type.name);
        } else {
          // Try to find nested types within the current message
          const nestedTypeName = field.type;
          if (type.nested && type.nested[nestedTypeName] && type.nested[nestedTypeName] instanceof protobuf.Type) {
            extractOptionalFieldsRecursive(type.nested[nestedTypeName], fieldPath, typePrefix ? `${typePrefix}.${type.name}` : type.name);
          }
        }
      } catch (error) {
        // If we can't resolve the type, just continue
        console.log(`Could not resolve nested type for field ${fieldPath}: ${error.message}`);
      }
    }
  }
  
  extractOptionalFieldsRecursive(messageType);
  return optionalFields;
}

/**
 * Extract optional field names from a protobuf message type
 * @param {protobuf.Type} messageType - The protobuf message type
 * @returns {Array<string>} Array of optional field names (including nested paths)
 */
function getOptionalFieldsFromType(messageType) {
  const optionalFields = [];
  
  function extractOptionalFieldsRecursive(type, fieldPrefix = '') {
    for (const field of type.fieldsArray) {
      const fieldPath = fieldPrefix ? `${fieldPrefix}.${field.name}` : field.name;
      
      // Check if the field has explicit optional keyword
      if (field.rule === 'optional') {
        optionalFields.push(fieldPath);
      }
      
      // If this field is a message type, recursively check its fields
      try {
        if (field.resolvedType && field.resolvedType instanceof protobuf.Type) {
          extractOptionalFieldsRecursive(field.resolvedType, fieldPath);
        } else {
          // Try to find nested types within the current message
          const nestedTypeName = field.type;
          if (type.nested && type.nested[nestedTypeName] && type.nested[nestedTypeName] instanceof protobuf.Type) {
            extractOptionalFieldsRecursive(type.nested[nestedTypeName], fieldPath);
          }
        }
      } catch (error) {
        // If we can't resolve the type, just continue
        console.log(`Could not resolve nested type for field ${fieldPath}: ${error.message}`);
      }
    }
  }
  
  extractOptionalFieldsRecursive(messageType);
  return optionalFields;
}

/**
 * Generate an empty JSON template for a protobuf message type
 * @param {protobuf.Type} messageType - The protobuf message type
 * @returns {Object} Empty JSON object with all fields set to appropriate empty values
 */
function generateEmptyJsonTemplate(messageType) {
  const template = {};
  
  for (const field of messageType.fieldsArray) {
    const fieldName = field.name;
    const fieldType = field.type;
    const isRepeated = field.rule === 'repeated';
    const isOptional = field.optional;
    
    // Generate empty value based on field type
    let emptyValue = getEmptyValueForType(fieldType, messageType.root || messageType.parent, messageType);
    
    // Handle repeated fields (arrays)
    if (isRepeated) {
      emptyValue = [];
    }
    
    // Add field to template
    template[fieldName] = emptyValue;
  }
  
  return template;
}

/**
 * Get appropriate empty value for a protobuf field type
 * @param {string} fieldType - The protobuf field type
 * @param {protobuf.Root} root - The protobuf root for type lookup
 * @param {protobuf.Type} parentType - The parent message type for nested lookups
 * @returns {*} Appropriate empty value
 */
function getEmptyValueForType(fieldType, root, parentType) {
  // Handle primitive types
  switch (fieldType) {
    case 'string':
      return '';
    case 'bool':
      return false;
    case 'int32':
    case 'int64':
    case 'uint32':
    case 'uint64':
    case 'sint32':
    case 'sint64':
    case 'fixed32':
    case 'fixed64':
    case 'sfixed32':
    case 'sfixed64':
      return 0;
    case 'float':
    case 'double':
      return 0.0;
    case 'bytes':
      return '';
    default:
      // Handle special google protobuf types
      if (fieldType === 'google.protobuf.Timestamp') {
        return '';  // Empty string for timestamp fields
      }
      
      // Try to find nested types first (within the current message)
      if (parentType && parentType.nested && parentType.nested[fieldType]) {
        const nestedType = parentType.nested[fieldType];
        if (nestedType instanceof protobuf.Type) {
          return generateEmptyJsonTemplate(nestedType);
        } else if (nestedType instanceof protobuf.Enum) {
          const values = Object.keys(nestedType.values);
          return values.length > 0 ? values[0] : '';
        }
      }
      
      // Handle custom message types and enums
      try {
        // Try to resolve as a message type first
        const nestedType = root.lookupType(fieldType);
        if (nestedType) {
          return generateEmptyJsonTemplate(nestedType);
        }
      } catch {
        // If not found globally, try to find it relative to the current message
        try {
          // This might be a nested type - try different resolution strategies
          const nestedType = root.lookupTypeOrEnum(fieldType);
          if (nestedType && nestedType instanceof protobuf.Type) {
            return generateEmptyJsonTemplate(nestedType);
          } else if (nestedType && nestedType instanceof protobuf.Enum) {
            // Handle enum
            const values = Object.keys(nestedType.values);
            return values.length > 0 ? values[0] : '';
          }
        } catch {
          // If it's not a message type, might be an enum
          try {
            const enumType = root.lookupEnum(fieldType);
            if (enumType) {
              // Return the first enum value (usually the default/zero value)
              const values = Object.keys(enumType.values);
              return values.length > 0 ? values[0] : '';
            }
          } catch {
            // If all else fails, return empty string
            return '';
          }
        }
      }
      return '';
  }
}

/**
 * Main function to run the parser from command line
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node protoparser.js <proto-file-path>');
    console.log('Example: node protoparser.js post_ride.proto');
    process.exit(1);
  }
  
  const protoFilePath = args[0];
  
  try {
    const methodMap = await parseProtoFile(protoFilePath);
    
    console.log('\n=== RESULT ===');
    console.log(JSON.stringify(methodMap, null, 2));
    
  } catch (error) {
    console.error('Failed to parse proto file:', error.message);
    process.exit(1);
  }
}

// Export for use as a module
module.exports = {
  parseProtoFile,
  parseProtoContent,
  getOptionalFieldsMap,
  generateEmptyJsonTemplate,
  getEmptyValueForType,
  getOptionalFieldsFromType,
  getOptionalFieldsFromTypeWithExplicit,
  parseExplicitOptionalFields
};

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}
