import socket
import threading
import json
import hashlib
import struct
import time


def recv_exact(sock, size):
    data = b""
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            return None
        data += chunk
    return data


class TCPReceiver:

    def __init__(self, host="0.0.0.0", port=8080):
        self.host = host
        self.port = port
        self.running = False
        self.server_socket = None

        self.total_received = 0
        self.total_bytes = 0
        self.invalid_packets = 0
        self.corrupted_packets = 0

        self._lock = threading.Lock()

    def start(self):
        self.running = True
        thread = threading.Thread(target=self._run_server, daemon=True)
        thread.start()
        print(f"[Receiver] Listening on {self.host}:{self.port}")

    def _run_server(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(10)

        while self.running:
            conn, addr = self.server_socket.accept()
            threading.Thread(
                target=self._handle_client,
                args=(conn,),
                daemon=True
            ).start()

    def _handle_client(self, conn):
        with conn:
            try:
                raw_len = recv_exact(conn, 4)
                if not raw_len:
                    return

                msg_len = struct.unpack("!I", raw_len)[0]

                data = recv_exact(conn, msg_len)
                if not data:
                    return

                with self._lock:
                    self.total_bytes += len(data)

                packet = json.loads(data.decode())

                if "packet_id" not in packet or "hash" not in packet:
                    self.invalid_packets += 1
                    return

                received_hash = packet.pop("hash")

                payload_string = json.dumps(packet, sort_keys=True)
                calculated_hash = hashlib.sha256(
                    payload_string.encode()
                ).hexdigest()

                if received_hash != calculated_hash:
                    self.corrupted_packets += 1
                    return

                with self._lock:
                    self.total_received += 1

                ack = {
                    "packet_id": packet["packet_id"],
                    "sequence": packet["sequence"],
                    "status": "received",
                    "receiver_timestamp": time.time()
                }

                ack_bytes = json.dumps(ack).encode()
                ack_len = struct.pack("!I", len(ack_bytes))

                conn.sendall(ack_len + ack_bytes)

            except Exception as e:
                print("[Receiver] Error:", e)

    def stop(self):
        self.running = False
        if self.server_socket:
            self.server_socket.close()

if __name__ == "__main__":
    receiver = TCPReceiver(host="0.0.0.0", port=8080)
    receiver.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        receiver.stop()