import cv2
from PIL import Image
import threading
from http.server import BaseHTTPRequestHandler,HTTPServer
from socketserver import ThreadingMixIn
import io as StringIO
import time
capture=None

class CamHandler(BaseHTTPRequestHandler):
	def do_GET(self):
		if self.path.endswith('.mjpeg'):
			self.send_response(200)
			self.send_header('Content-type','multipart/x-mixed-replace; boundary=--jpgboundary')
			self.send_header("Access-Control-Allow-Origin", "*")
			self.end_headers()
			while True:
				try:
					rc,img = capture.read()
					if not rc:
						continue
					imgRGB=img#cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
					jpg = Image.fromarray(imgRGB)
					tmpFile = StringIO.BytesIO()
					jpg.save(tmpFile,'JPEG')
					self.wfile.write(b"--jpgboundary")
					self.send_header('Content-type','image/jpeg')
					self.send_header('Content-length',str(tmpFile.getbuffer().nbytes))
					self.end_headers()
					jpg.save(self.wfile,'JPEG')
					time.sleep(0.05)
				except KeyboardInterrupt:
					break
		else:
			self.send_response(200)
			self.send_header('Content-type','text/html')
			with open("index.html", "br") as f:
				html = f.read()
				self.send_header('Content-length', str(len(html)))
				self.end_headers()
				self.wfile.write(html)
		return


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
	"""Handle requests in a separate thread."""

def main():
	global capture
	capture = cv2.VideoCapture(0)
	# capture.set(cv2.CAP_PROP_FRAME_WIDTH, 320) 
	# capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
	# capture.set(cv2.CAP_PROP_SATURATION,0.2)
	global img
	try:
		server = ThreadedHTTPServer(('localhost', 8008), CamHandler)
		print("server started")
		server.serve_forever()
	except KeyboardInterrupt:
		capture.release()
		server.socket.close()

if __name__ == '__main__':
	main()
