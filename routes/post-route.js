import http, { get } from 'http';
import { cleanupHTMLOutput, getRequestBody } from '../utilities.js';
import { dbo } from '../index.js';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import { connect } from 'http2';

/**
 * 
 * @param {string[]} pathSegments 
 * @param {http.IncomingMessage} request 
 * @param {http.IncomingMessage} response 
 */
export async function handleProfilesRoute(pathSegments, url, request, response) {
    let nextSegment = pathSegments.shift();

    if (!nextSegment) {
        if (request.method === 'POST') {
            let body = await getRequestBody(request);

            let params = new URLSearchParams(body);
            console.log(params)

            if (!params.get('userName') || !params.get('title')
                || !params.get('breadText')) {

                response.writeHead(400, { 'Content-Type': 'text/plain' });
                response.write('400 Bad Request');
                response.end();
                return;

            }

            let result = await dbo.collection('Posts').insertOne({
                'userName': params.get('userName'),
                'title': params.get('title'),
                'breadText': params.get('breadText')
            });

            response.writeHead(303, { 'Location': '/showcasepost/' + result.insertedId });


            response.end();
            return;
        }
        if (request.method === 'GET') {
            let filter = {};

            response.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            response.write(template);
            response.end();
            return;
        }
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write('405 Method Not Allowed');
        response.end();
        return;
    }

    

    if (request.method === 'DELETE') {
        try {
            await dbo.collection('Posts').deleteOne({
                "_id": new ObjectId(nextSegment)

            });
        } catch (e) {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.write('404 Not Found');
            response.end();
            return;
        }

        response.writeHead(204);
        response.end();
        return;


    }



    if(request.method === "GET"){
        let profileDocument;
    try {
        profileDocument = await dbo.collection('Posts').findOne({
            "_id": new ObjectId(nextSegment)
        });
    } catch (e) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found');
        return;
    }

    if (!profileDocument) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found');
        response.end();
        return;
    }
        let template = (await fs.readFile('templates/showcase-post.blogg')).toString();
        template = template.replaceAll('%{userName}%', cleanupHTMLOutput(profileDocument.userName));
        template = template.replaceAll('%{title}%', cleanupHTMLOutput(profileDocument.title));
        template = template.replaceAll('%{breadText}%', cleanupHTMLOutput(profileDocument.breadText));
        template = template.replaceAll('%{_id}%', cleanupHTMLOutput(profileDocument._id.toString()));
    
        response.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
        response.write(template);
        response.end();
        return;
    }

   

    


}
