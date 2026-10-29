#!/usr/bin/env python3
"""Serve the configurator locally and open the default browser."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import webbrowser


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4173)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1] / 'site'
    handler = partial(SimpleHTTPRequestHandler, directory=str(site))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as error:
        parser.exit(1, f'サーバーを起動できません: {error}\n既存のサーバーはCtrl+Cで停止できます。\n')
    with server:
        url = f'http://127.0.0.1:{server.server_port}/'
        print(f'Mejiro31: {url}\n停止するにはCtrl+Cを押してください。', flush=True)
        if not args.no_open:
            Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
