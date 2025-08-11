# Twirp Proto Tester

A web-based tool for testing Twirp RPC services with automatic JSON template generation from Protocol Buffer definitions.

## Features

- 🚀 **Auto JSON Template Generation**: Automatically generates accurate JSON request templates from proto files
- 📝 **Complex Proto Support**: Handles nested messages, enums, imports, and google.protobuf types
- 🎯 **Twirp Ready**: Pre-configured for Twirp RPC testing with proper URL construction
- 🖥️ **Web Interface**: Clean, intuitive drag-and-drop interface with line-numbered JSON editor
- 📋 **Smart Defaults**: Provides contextual default values for different field types
- ⏰ **Auto Timestamps**: Automatically fills google.protobuf.Timestamp fields with current time
- 🏷️ **Field Metadata**: Shows optional fields and enum values in an easy-to-read legend
- 🔍 **Error-Friendly**: Line numbers in JSON editor help identify syntax errors quickly

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd twirp-proto-tester
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:8765`

### Production Deployment (Background Service)

For production use, you can run the service as a background process that automatically starts on system boot:

1. **Install PM2** (if not already installed):
   ```bash
   sudo npm install -g pm2
   ```

2. **Start as background service**:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Set up auto-startup** (run once):
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Use the service management script**:
   ```bash
   # Show available commands
   ./service.sh

   # Common operations
   ./service.sh status    # Check service status
   ./service.sh logs      # View logs
   ./service.sh restart   # Restart service
   ./service.sh open      # Open in browser
   ```

5. **Health monitoring**:
   ```bash
   ./health-check.sh      # Check service health
   pm2 monit             # Real-time monitoring
   ```

The service runs on **port 8765** by default (configurable via `PORT` environment variable).

## Usage

1. **Upload Proto Files**: Drag and drop your `.proto` files or click to select them
2. **Select Service & Method**: Choose from the automatically detected services and methods
3. **Review Generated Template**: The tool automatically:
   - Generates complete JSON templates with proper field types
   - Shows optional fields and enum values in a legend
   - Pre-fills timestamp fields with current time
   - Provides line numbers for easy editing
4. **Configure Server**: Set your Twirp server base URL
5. **Send Request**: Test your Twirp endpoint with the generated request

## Example

The `examples/` folder contains a sample `user_service.proto` file that demonstrates:

```protobuf
service UserService {
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
}

message CreateUserRequest {
  string name = 1;                              // required
  string email = 2;                             // required  
  optional int32 age = 3;                       // optional
  optional UserType user_type = 4;              // optional enum
  optional google.protobuf.Timestamp created_at = 5; // auto-filled with current time
  Address address = 6;                          // required nested message

  enum UserType {
    STANDARD = 0;
    PREMIUM = 1;
    ADMIN = 2;
  }
}
```

For this proto definition, the tool automatically generates:

```json
{
  "name": "",
  "email": "",
  "age": 0,
  "user_type": "STANDARD",
  "created_at": "2025-07-23T18:30:00.000Z",
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": "US"
  }
}
```

Plus a helpful legend showing:
- **Optional fields:** age, user_type, created_at
- **Enum fields:** user_type: [STANDARD, PREMIUM, ADMIN], address.country: [US, CA, UK, DE, FR]
## Project Structure

```
twirp-proto-tester/
├── server.js              # Express server with proto parsing and Twirp proxy
├── protoparser.js          # Core proto parsing and template generation
├── public/
│   └── index.html         # Web interface with line-numbered JSON editor
├── imports/               # External proto dependencies (gitignored)
│   └── google/protobuf/   # Common protobuf definitions (timestamp.proto, etc.)
├── examples/              # Example proto files (gitignored)
│   └── user_service.proto # Sample proto file demonstrating features
└── package.json          # Dependencies and scripts
```

## Key Features in Detail

### Smart Template Generation
- **Nested Messages**: Properly handles complex nested message structures
- **Enum Defaults**: Uses the first enum value (usually the zero/default value)
- **Timestamp Auto-fill**: google.protobuf.Timestamp fields get current ISO 8601 time
- **Type-aware Defaults**: Appropriate defaults for strings, numbers, booleans, etc.

### Enhanced User Experience
- **Line Numbers**: JSON editor with line numbers for easy error identification
- **Field Legends**: Shows optional fields and available enum values
- **Drag & Drop**: Simple file upload with visual feedback
- **CORS Handling**: Built-in proxy to avoid browser CORS issues with Twirp servers

### Import Resolution
- Automatically resolves proto file imports
- Supports google.protobuf.* types out of the box
- Handles relative import paths correctly

## API Endpoints

- `POST /api/parse-proto` - Upload and parse proto files, returns services with templates
- `POST /api/twirp-request` - Proxy Twirp requests to avoid CORS issues
- `GET /` - Serve the web interface

## Development

### Running in Development Mode
```bash
npm run dev     # Start with nodemon for auto-restart
```

### Testing with Example Files
1. Start the server: `npm start`
2. Upload the `examples/user_service.proto` file
3. Select the UserService and any method
4. Observe the auto-generated JSON template with timestamps and enum defaults

### Adding New Proto Files
1. Place your `.proto` files and any imports in the appropriate directories
2. Upload via the web interface
3. The tool will automatically parse and generate templates

## Common Use Cases

- **API Development**: Quickly test new Twirp endpoints during development
- **Documentation**: Generate example requests for API documentation
- **Debugging**: Test request formats and troubleshoot API issues
- **Integration Testing**: Validate proto definitions work with real services

## Requirements

- Node.js 14+ (tested with v18.15.0)
- Modern web browser with JavaScript enabled
- Twirp-compatible RPC server for testing (optional)

## Dependencies

- **express** - Web server framework
- **multer** - File upload handling
- **protobufjs** - Protocol buffer parsing and reflection
- **cors** - Cross-origin resource sharing

## Development

### Testing the Parser

You can test the proto parser directly:
```bash
node protoparser.js your-proto-file.proto
```

### Server Logs

View server logs at `http://localhost:3000/logs` or check the `server.log` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

- **Empty JSON templates**: Ensure your proto files have proper service definitions
- **Import errors**: Make sure all imported proto files are uploaded together
- **Server errors**: Check the logs at `/logs` endpoint for detailed error information

### Supported Proto Features

- ✅ Nested messages
- ✅ Enums with proper default values
- ✅ Repeated fields (arrays)
- ✅ Google protobuf types (Timestamp, etc.)
- ✅ Custom imports
- ✅ Complex field types

## Acknowledgments

Built for testing Twirp RPC services with a focus on developer experience and accurate proto reflection.
