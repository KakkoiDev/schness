from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import os
from pathlib import Path
os.chdir(Path(__file__).resolve().parents[2])
class H(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  if path.startswith('/external/'): return '/tmp/schness-browser-engines/package/'+path[len('/external/'):].split('?')[0]
  return super().translate_path(path)
 def end_headers(self):
  self.send_header('Cross-Origin-Opener-Policy','same-origin'); self.send_header('Cross-Origin-Embedder-Policy','require-corp'); super().end_headers()
 def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',4187),H).serve_forever()
