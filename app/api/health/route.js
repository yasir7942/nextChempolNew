// app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        ok: true,
        ts: Date.now(),
    });
}



/*  Shh CMD */
/*
How to create /usr/local/bin/watch-next.sh
1. Use Plesk’s Web Terminal (no SSH client needed)
In Plesk, go to Tools & Settings → Web Terminal.

Click Open. You’ll get a root shell prompt in your browser.

Run: */

/*

cat << 'EOF' > /usr/local/bin/watch-next.sh
#!/usr/bin/env bash
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://chempol.co.uk/api/health)
if [ "$HEALTH" != "200" ]; then
  echo "$(date): Health check failed (HTTP $HEALTH), restarting…" >> /var/log/next-watch.log
  pm2 restart my-next-app
fi
EOF

chmod +x /usr/local/bin/watch-next.sh


*/


/*
Bonus: Plesk Scheduled Task
Since you’re on Plesk, you can skip cron and instead:

Go to Scheduled Tasks in Plesk for your domain.

Add a Task Type: Run a command every minute:

 
/usr/local/bin/watch-next.sh


*/
