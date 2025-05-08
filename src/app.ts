import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import userRoutes from "./routes/user";
import serviceRoutes from "./routes/service";

const app = express();
app.use(express.json());

// Mount routers. (Attach auth middleware as needed per route or globally.)
app.use("/api", userRoutes);
app.use("/api", serviceRoutes);

// Apply JWT authentication middleware for all subsequent (protected) routes..
// app.use(jwtAuthMiddleware);

// ------------------------------------------------------------------
// LOAD BALANCER SETUP
// ------------------------------------------------------------------

const numOfServers = 15;
const servers: string[] = [];
let cur = 0;

function loadServers(count: number, appInstance: express.Express) {
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

const proxy = httpProxy.createProxyServer({ secure: false });
const loadBalancerPort = 3000;

const lbServer = http.createServer((req, res) => {
  if (servers.length === 0) {
    res.writeHead(503);
    return res.end("No servers available");
  }

  const start = Date.now();
  const target = servers[cur];
  cur = (cur + 1) % servers.length;

  console.log(`Routing request to ${target}`);
  proxy.web(
    req,
    res,
    { target },
    (err: any) => {
      console.error("Proxy error: " + err.toString());
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Something went wrong.");
    }
  );
  res.on("finish", () =>
    console.log(`${req.method} ${req.url} completed in ${Date.now() - start}ms`)
  );
});

lbServer.listen(loadBalancerPort, () => {
  console.log(`Load balancer listening on port ${loadBalancerPort}`);
});
