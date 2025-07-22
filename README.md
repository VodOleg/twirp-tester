# Twirp Proto Tester

A web-based tool for testing Twirp RPC services with automatic JSON template generation from Protocol Buffer definitions.

## Features

- 🚀 **Auto JSON Template Generation**: Automatically generates accurate JSON request templates from proto files
- 📝 **Complex Proto Support**: Handles nested messages, enums, imports, and google.protobuf types
- 🎯 **Twirp Ready**: Pre-configured for Twirp RPC testing with proper URL construction
- 🖥️ **Web Interface**: Clean, intuitive drag-and-drop interface
- 📋 **Smart Defaults**: Provides contextual default values for different field types

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

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload Proto Files**: Drag and drop your `.proto` files or click to select them
2. **Select Service & Method**: Choose from the automatically detected services and methods
3. **Review JSON Template**: The tool generates a complete JSON template with proper field types
4. **Configure Server**: Set your Twirp server base URL
5. **Send Request**: Test your Twirp endpoint with the generated request

## Example

For a proto definition like:
```protobuf
service PostRide {
  rpc CancelOrder(CancelOrderRequest) returns (CancelOrderResponse);
}

message CancelOrderRequest {
  int64 id = 1;
  OrderData data = 2;
  AuditInfo audit = 3;
}
```

The tool automatically generates:
```json
{
  "id": 0,
  "data": {
    "cancellation_outcome": "UNDEFINED",
    "cancelled_at": "",
    "payment": {
      "tip": { "percentage": 0 },
      "payment_type": "UNDEFINED"
    }
  },
  "audit": {
    "username": "",
    "source": "UNDEFINED"
  }
}
```

## Project Structure

```
twirp-proto-tester/
├── server.js              # Express server with proto parsing
├── protoparser.js          # Core proto parsing and template generation
├── public/
│   └── index.html         # Web interface
├── google/protobuf/       # Common protobuf definitions
├── gett/api/             # Additional proto imports
├── post_ride.proto       # Sample proto file for testing
└── package.json          # Dependencies and scripts
```

## API Endpoints

- `POST /api/parse-proto` - Upload and parse proto files
- `GET /logs` - View server logs
- `GET /` - Serve the web interface

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
