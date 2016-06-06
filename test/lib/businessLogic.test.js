/**
 * Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

const logic = require('../../lib/service/businesslogic');
const should = require('should');
const testTaskName = 'myTaskName';

const quickRandom = () => {
  return Math.floor(Math.random() * (1000 - 1) + 1);
};

const sampleTask = (name) => {
  return {
    taskId: 123456,
    appId: 12345,
    appMetadata: {
      _id: '12345',
      appsecret: 'appsecret',
      mastersecret: 'mastersecret',
      pushService: void 0,
      restrictions: {
        level: 'starter'
      },
      API_version: 3,
      name: 'DevApp',
      platform: null
    },
    authKey: 'abc123',
    requestId: 'ea85600029b04a18a754d57629cff62d',
    taskType: 'businessLogic',
    taskName: name,
    containerMappingId: 'abc:123',
    method: 'POST',
    endpoint: null,
    request: {
      method: 'POST',
      headers: {
        host: 'localhost:7007',
        'X-Kinvey-Custom-Request-Properties': '{"foo":"bar"}',
        'x-kinvey-include-headers-in-response': 'Connection;Content-Length;Content-Type;Date;Location;X-Kinvey-API-Version;X-Kinvey-Request-Id;X-Powered-By;Server',
        authorization: 'Basic a2lkX1oxQkVoeDJDczpkYmNiNTUwMWZlOGM0MWQ3YTFmOTkyYjhkNTdiOGEzOA==',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'en-us',
        'x-kinvey-responsewrapper': 'true',
        accept: '*/*',
        origin: 'http://0.0.0.0:4200',
        'content-length': '0',
        connection: 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25',
        referer: 'http://0.0.0.0:4200/environments/kid_Z1BEhx2Cs/business-logic/endpoint/quick/editor'
      },
      username: 'kid_Z1BEhx2Cs',
      userId: 'kid_Z1BEhx2Cs',
      entityId: '12345',
      serviceObjectName: null
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
};

const sampleBadTask = (name) => {
  return {
    request: {
      body: 'abc'
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
};

describe('business logic', () => {
  describe('logic registration', () => {
    it('can register a logic task', (done) => {
      logic.register(testTaskName, (request, complete) => {
        return done();
      });
      const fn = logic.resolve(testTaskName);
      return fn();
    });
  });
  return describe('completion handlers', () => {
    afterEach((done) => {
      logic.clearAll();
      return done();
    });
    it("should return a 'BadRequest' response with a null task name", (done) => {
      const task = sampleTask(null);
      return logic.process(task, null, (err) => {
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('No task name to execute');
        return done();
      });
    });
    it("should return a 'BadRequest' response with a non-JSON task", (done) => {
      const task = sampleBadTask(null);
      return logic.process(task, null, (err) => {
        console.log(require('util').inspect(err));
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('Request body is not JSON');
        return done();
      });
    });
    it('should return a successful response', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete().ok().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql('{}');
        return done();
      });
    });
    it('should include a body', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete({
          foo: 'bar'
        }).ok().next();
      });
      return logic.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 201 created', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete({
          foo: 'bar'
        }).created().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(201);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 202 accepted', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete({
          foo: 'bar'
        }).accepted().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(202);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 400 bad request', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('This is a bad request').badRequest().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(400);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('BadRequest');
        result.response.body.description.should.eql('Unable to understand request');
        result.response.body.debug.should.eql('This is a bad request');
        return done();
      });
    });
    it('should return a 401 unauthorized', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('You are not authorized!').unauthorized().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('InvalidCredentials');
        result.response.body.description.should.eql('Invalid credentials. Please retry your request with correct credentials');
        result.response.body.debug.should.eql('You are not authorized!');
        return done();
      });
    });
    it('should return a 403 forbidden', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('Forbidden!').forbidden().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(403);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('Forbidden');
        result.response.body.description.should.eql('The request is forbidden');
        result.response.body.debug.should.eql('Forbidden!');
        return done();
      });
    });
    it('should return a 404 not found', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('The request is not found!').notFound().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(404);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotFound');
        result.response.body.description.should.eql('The requested entity or entities were not found in the serviceObject');
        result.response.body.debug.should.eql('The request is not found!');
        return done();
      });
    });
    it('should return a 405 not allowed', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('The request is not allowed!').notAllowed().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(405);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotAllowed');
        result.response.body.description.should.eql('The request is not allowed');
        result.response.body.debug.should.eql('The request is not allowed!');
        return done();
      });
    });
    it('should return a 501 not implemented', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('This isn\'t implemented').notImplemented().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(501);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotImplemented');
        result.response.body.description.should.eql('The request invoked a method that is not implemented');
        result.response.body.debug.should.eql('This isn\'t implemented');
        return done();
      });
    });
    it('should return a 550 runtime error', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete('There was some error in the app!').runtimeError().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(550);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('DataLinkRuntimeError');
        result.response.body.description.should.eql('The Datalink had a runtime error.  See debug message for details');
        result.response.body.debug.should.eql('There was some error in the app!');
        return done();
      });
    });
    it('should process a next (continuation) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete({
          foo: 'bar'
        }).ok().next();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        result.response.continue = true;
        return done();
      });
    });
    return it('should process a done (completion) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => {
        return complete({
          foo: 'bar'
        }).ok().done();
      });
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        result.response.continue = false;
        return done();
      });
    });
  });
});