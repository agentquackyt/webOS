import { serve } from "bun";
import indexHtml from "./index.html";

serve({
  port: 3000,
  routes: {
    "/": indexHtml
  },
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    
    const file = Bun.file(`.${path}`);
    const exists = await file.exists();
    
    if (exists) {
      return new Response(file);
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log("Server running at http://localhost:3000");
