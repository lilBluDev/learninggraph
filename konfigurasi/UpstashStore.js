import session from "express-session";

export default class UpstashStore extends session.Store {
    constructor(options) {
        super();
        this.client = options.client;
        this.prefix = options.prefix || "sess:";
        this.ttl = options.ttl || 86400; // Default 24 hours in seconds
    }

    async get(sid, callback) {
        try {
            const key = this.prefix + sid;
            const data = await this.client.get(key);
            
            if (!data) {
                return callback(null, null);
            }
            
            // Handle both string and object responses from Upstash
            const session = typeof data === 'string' ? JSON.parse(data) : data;
            callback(null, session);
        } catch (err) {
            console.error('UpstashStore get error:', err);
            callback(err);
        }
    }

    async set(sid, session, callback) {
        try {
            const key = this.prefix + sid;
            const maxAge = session.cookie?.maxAge;
            const ttl = maxAge ? Math.floor(maxAge / 1000) : this.ttl;
            
            // CRITICAL: Ensure session data is properly structured
            const sessionData = {
                cookie: session.cookie,
                userId: session.userId,
                ...session
            };
            
            // Serialize session data
            const value = JSON.stringify(sessionData);
            
            console.log('UpstashStore SET:', { key, sessionData, ttl });
            
            // Set with expiration
            await this.client.set(key, value, { ex: ttl });
            
            callback(null);
        } catch (err) {
            console.error('UpstashStore set error:', err);
            callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            const key = this.prefix + sid;
            await this.client.del(key);
            callback(null);
        } catch (err) {
            console.error('UpstashStore destroy error:', err);
            callback(err);
        }
    }

    async touch(sid, session, callback) {
        try {
            const key = this.prefix + sid;
            const maxAge = session.cookie?.maxAge;
            const ttl = maxAge ? Math.floor(maxAge / 1000) : this.ttl;
            
            // Update expiration time
            await this.client.expire(key, ttl);
            
            callback(null);
        } catch (err) {
            console.error('UpstashStore touch error:', err);
            callback(err);
        }
    }
}