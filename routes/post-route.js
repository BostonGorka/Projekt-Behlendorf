import http from 'http';
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

            if (url.searchParams.has('title')) {
                filter.age = url.searchParams.get('title');
            }

            if (url.searchParams.has('breadText')) {
                filter.name = url.searchParams.get('breadText');
            }

            let documents = await dbo.collection('Posts').find(filter).toArray();

            let profileString = '';

            for (let i = 0; i < documents.length; i++) {
                profileString += '<li><a href="/profile/' + cleanupHTMLOutput(documents[i]._id.toString()) + '">' + cleanupHTMLOutput(documents[i].teamName) + ' (' + cleanupHTMLOutput(documents[i].phoneNumber) + ')</a></li>';
            }
            let template = (await fs.readFile('templates/profiles-list.volvo')).toString();

            template = template.replaceAll('%{profilesList}%', profileString);

            response.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            response.write(template);
            response.end();
            return;
        }
    }
}