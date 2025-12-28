#!/bin/bash
cd "$(dirname "$0")"
bun build index.ts --compile --outfile=rid128b64
