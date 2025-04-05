const axios = require("axios");
const Transform = require("stream").Transform;

// const {allowedExtensions, LineTransform} = require("../service/lineTransform")
const allowedExtensions = ['.ts', '.png', '.jpg', '.webp', '.ico', '.html', '.js', '.css', '.txt'];

class LineTransform extends Transform {
    buffer = "";
    baseUrl = "";

    constructor(baseUrl) {
        super();
        this.buffer = '';
        this.baseUrl = baseUrl;
    }


    _transform(chunk, encoding, callback) {
        const data = this.buffer + chunk.toString();
        const lines = data.split(/\r?\n/);
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            const modifiedLine = this.processLine(line);
            this.push(modifiedLine + '\n');
        }

        callback();
    }

    _flush(callback) {
        if (this.buffer) {
            const modifiedLine = this.processLine(this.buffer);
            this.push(modifiedLine);
        }
        callback();
    }

    processLine(line) {
        if (line.endsWith('.m3u8') || line.endsWith('.ts')) {
            return `proxy?url=${this.baseUrl}${line}`;
        }

        if (allowedExtensions.some(ext => line.endsWith(ext))) {
            return `proxy?url=${line}`;
        }

        return line;
    }
}

const proxyHandler = async function (req, res) {
    try {
        const url = req.query.url;
        if (!url) return res.status(404).send('url is required');
        const isStaticFiles = allowedExtensions.some(ext => url.endsWith(ext));
        const baseUrl = url.replace(/[^/]+$/, "");

        const response = await axios.get(url, {
            responseType: "stream",
            headers: {Accept: "*/*", Referer: "https://megacloud.club/"}
        });

        const headers = {...response.headers};
        if (!isStaticFiles) delete headers["content-length"];

        res.cacheControl = {maxAge: headers["cache-control"]};
        res.set(headers);

        if (isStaticFiles) {
            return response.data.pipe(res);
        }

        const transform = new LineTransform(baseUrl);
        response.data.pipe(transform).pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send('error : ' + err)
    }
}

module.exports = proxyHandler;