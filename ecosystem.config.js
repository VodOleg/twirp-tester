module.exports = {
  apps: [{
    name: 'twirp-proto-tester',
    script: 'server.js',
    // cwd will default to the directory where this config file is located
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8765
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
