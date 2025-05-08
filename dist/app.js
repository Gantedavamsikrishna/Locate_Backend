"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const user_1 = __importDefault(require("./routes/user"));
const service_1 = __importDefault(require("./routes/service"));
const auth_1 = __importDefault(require("./routes/auth"));
const auth_2 = require("./utils/auth");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Mount routers. (Attach auth middleware as needed per route or globally.)
app.use("/api", user_1.default);
app.use("/api", service_1.default);
app.use('/api/auth', auth_1.default);
// Apply JWT authentication middleware for all subsequent (protected) routes..
app.use(auth_2.jwtAuthMiddleware);
// ------------------------------------------------------------------
// LOAD BALANCER SETUP
// ------------------------------------------------------------------
const numOfServers = 15;
const servers = [];
let cur = 0;
function loadServers(count, appInstance) {
    for (let i = 0; i < count; i++) {
        const server = appInstance.listen(0, () => {
            const addr = server.address();
            if (addr && typeof addr === "object") {
                const url = `http://localhost:${addr.port}`;
                servers.push(url);
                console.log(`Worker ${i} listening on port ${addr.port}`);
            }
        });
    }
}
loadServers(numOfServers, app);
const proxy = http_proxy_1.default.createProxyServer({ secure: false });
const loadBalancerPort = 3000;
const lbServer = http_1.default.createServer((req, res) => {
    if (servers.length === 0) {
        res.writeHead(503);
        return res.end("No servers available");
    }
    const start = Date.now();
    const target = servers[cur];
    cur = (cur + 1) % servers.length;
    console.log(`Routing request to ${target}`);
    proxy.web(req, res, { target }, (err) => {
        console.error("Proxy error: " + err.toString());
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Something went wrong.");
    });
    res.on("finish", () => console.log(`${req.method} ${req.url} completed in ${Date.now() - start}ms`));
});
lbServer.listen(loadBalancerPort, () => {
    console.log(`Load balancer listening on port ${loadBalancerPort}`);
});
