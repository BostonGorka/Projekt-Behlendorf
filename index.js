import 'dotenv/config';
import http from 'http';
import { MongoClient } from 'mongodb';
import { getRequestBody, cleanupHTMLOutput } from './utilities.js';
import fs from 'fs/promises';
import { handleProfilesRoute } from './routes/post-route.js';


let dbConn = await MongoClient.connect(process.env.MONGODB_CONNECTION_STRING);
export let dbo = dbConn.db(process.env.MONGODB_DATABASE_NAME);


async function handleRequest(request, response) {

    let url = new URL(request.url, 'http://' + request.headers.host);
    let path = url.pathname;
    let pathSegments = path.split('/').filter(function (segment) {
        if (segment === '' || segment === '..') {
            return false;
        } else {
            return true;
        }
    });

    let nextSegment = pathSegments.shift();

    if (nextSegment === 'startpage') {
        if (request.method !== 'GET') {
            response.writeHead(405, { 'Content-Type': 'text/plain' });
            response.write('405 Method Not Allowed');
            response.end();
            return;
        }

        let documents = await dbo.collection('Posts').find().toArray();

        let profileString = '';


        for (let i = 0; i < documents.length; i++) {
            profileString += '<li><a href="/showcasepost/' + cleanupHTMLOutput(documents[i]._id.toString()) + '">' + cleanupHTMLOutput(documents[i].title) + ')</a></li>';
        }
        let template = (await fs.readFile('templates/startpage.blogg')).toString();

        template = template.replaceAll('%{postList}%', profileString);


        response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
        response.write(template);
        response.end();
        return;
    }

    if (nextSegment === 'createpost') {
        if (request.method !== 'GET') {
            response.writeHead(405, { 'Content-Type': 'text/plain' });
            response.write('405 Method Not Allowed');
            response.end();
            return;
        }
        let template = (await fs.readFile('templates/create-post.blogg')).toString();

        response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
        response.write(template);
        response.end();
        return;

    }

    if (nextSegment === 'showcasepost') {
        await handleProfilesRoute(pathSegments, url, request, response);
        return;
    }
    if (nextSegment === 'managepost') {
        if (request.method === 'GET') {
            let template = (await fs.readFile('templates/managepost.blogg')).toString();
           //
            template = template.replaceAll('%{userName}%', cleanupHTMLOutput(profileDocument.userName));
            template = template.replaceAll('%{title}%', cleanupHTMLOutput(profileDocument.title));
            template = template.replaceAll('%{breadText}%', cleanupHTMLOutput(profileDocument.breadText));


            response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
            response.write(template);
            response.end();
            return;

        }
        if (request.method === 'POST') {
            let template = (await fs.readFile('templates/managepost.blogg')).toString();

            response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
            response.write(template);
            response.end();
            return;

        }


    }
}
let server = http.createServer(handleRequest);

server.listen(process.env.PORT);
