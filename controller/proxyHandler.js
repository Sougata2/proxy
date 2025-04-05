const axios = require("axios");

const {allowedExtensions, LineTransform} = require("../service/lineTransform");

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