"""Tiny, local-only webhook receiver for Grafana; prints alert names to Docker logs."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/alerts':
            self.send_error(404)
            return
        raw = self.rfile.read(min(int(self.headers.get('Content-Length', '0')), 65536))
        try:
            obj = json.loads(raw)
            print('Grafana alert webhook:', json.dumps({'status':obj.get('status'), 'alerts':[a.get('labels',{}).get('alertname','unknown') for a in obj.get('alerts',[])]}), flush=True)
        except ValueError:
            print('Grafana webhook: malformed JSON', flush=True)
        self.send_response(204)
        self.end_headers()
    def do_GET(self):
        self.send_response(200 if self.path == '/health' else 404)
        self.end_headers()

HTTPServer(('0.0.0.0',8099), Handler).serve_forever()
