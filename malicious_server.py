from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class MaliciousHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    os.chdir('malicious')
    server = HTTPServer(('0.0.0.0', 8111), MaliciousHandler)
    print("MALICIOUS server running on http://localhost:8111")
    print("FOR EDUCATIONAL PURPOSES ONLY")
    server.serve_forever()