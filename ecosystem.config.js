module.exports = {
    apps: [{
        name: "Chempol-Uk-NextJS",
        script: "node_modules/next/dist/bin/next",
        args: "start -p 3004",
        cwd: "/var/www/vhosts/chempol.co.uk/httpdocs",
        env: {
            NODE_ENV: "production"
        },

        // Robustness
        autorestart: true,
        exp_backoff_restart_delay: 2000, // exponential backoff (ms)
        max_restarts: 20,
        max_memory_restart: "4G",        // restart if memory leaks

        // Zero-downtime reloads
        exec_mode: "fork",
        instances: "1",                 // or a fixed number like 2

        // Optional (your paths)
        out_file: "/var/log/next-app.out.log",
        error_file: "/var/log/next-app.err.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    }]
};


// npx pm2 start ecosystem.config.js
//pm2 scale AGL-PK-NextJS 1
//npx pm2 reload   AGL-PK-NextJS
//pm2 scale AGL-PK-NextJS 3
//npx pm2 save