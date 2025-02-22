export class FastMemoryStore {
    constructor() {
        this.data = {};
        this.expiries = [];
    }
    async get(key) {
        this.clean();
        const entry = this.data[key];
        if (!entry || (entry.expires && entry.expires < Date.now())) {
            delete this.data[key];
            return undefined;
        }
        return entry.value;
    }
    async set(key, value, ttl) {
        this.data[key] = {
            value,
            expires: ttl ? Date.now() + ttl : undefined
        };
        if (ttl) {
            this.expiries.push([key, this.data[key].expires]);
            this.sortExpiries();
        }
    }
    async delete(key) {
        const existed = key in this.data;
        delete this.data[key];
        this.expiries = this.expiries.filter(([k]) => k !== key);
        return existed;
    }
    async clear() {
        this.data = {};
        this.expiries = [];
    }
    async has(key) {
        this.clean();
        const entry = this.data[key];
        return !!entry && (!entry.expires || entry.expires > Date.now());
    }
    clean() {
        const now = Date.now();
        while (this.expiries.length && this.expiries[0][1] <= now) {
            const [key] = this.expiries.shift();
            delete this.data[key];
        }
    }
    sortExpiries() {
        this.expiries.sort((a, b) => a[1] - b[1]);
    }
}
