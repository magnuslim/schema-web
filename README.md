# Schema Web

> A lightweight web API framework with JSON-schema validation, following the Convention Over Configuration principle.

# Convention

1. An **API** is... hmmm... Well, you know, an API.
    - We define an API in this pattern: `model.sub_model.verb`, such as `school.grade.class.student.get`. It is just like a flatted restful API. We consider this a more independent way to deal with different logic rather than a restful one. Also, more extensible.
    - For requests with a session, we provide an HTTP header called `Web-State` to achieve this. When the HTTP request contains this header, the server will extract it as a part of the request. It is defined in this way: `Web-State: sessionid={id}&foo={bar}`.

2. An API will map to ONE `schema` and ONE `handler`. The schema is used to describe the API, and the handler is to handle and deal with the request.

3. A **schema** is a module that exports an object with properties `request`, `response`, `constant` and `info`: 
    - **request**: An instance of [semantic-schema](https://github.com/magnuslim/semantic-schema) describing the request of the API, will be used to validate the request.
    - **response**: Same as above, will be used to validate the response.
    - **constant**: Constant values that the API uses.
    - **info**: Base info to make it easier for your partners to understand the API, such as `author`, `title` and so on. Feel free to add some other property here because the framework will not really use it.

4. A **handler** is a module that exports an async function, while arguments of the function are the requested content, and the return of it will be treated as the response.
    ```js
    // state is an object extract from the http header 'Web-State'.
    // request is the request from client side, validated by schema.
    // constant is the constant defined in schema.
    module.exports = async({state, request, constant}) {
        let response;
        // your logic here...
        return response;
    }
    ```

5. The framework will load either the schema file or the handler file with the same name as the API from their belonging folder. For example:
    ```js
    //API name: school.grade.class.student.get

    //schema file: 
    ${schema_folder}/school.grade.class.student.get.js
    ${schema_folder}/school.grade.class.student.get/index.js

    //handler file:
    ${handler_folder}/school.grade.class.student.get.js
    ${handler_folder}/school.grade.class.student.get/index.js
    ```

6. Besides these, there are two less critical concepts: **middleware** & **router**:
    - **middleware**: A component that pre-processes the request for pattern-matched API before validating the request and passing it to the handler. You can use params `apiName`, `schema` and `payload` here. A common use case of middleware is user authorisation. You can pass several middlewares in **a sorted array** to the framework to make it works.
    - **router**: A route function to redirect your request to another API, default to `apiName => apiName`. One of its usages is to versionize your client.

# Usage

## Server Side

Create a entry file `index.js` for the server:
```js
const Server = require('schema-web').Server;

let server = new Server({
    host: "127.0.0.1",
    port: 3005,
    handlerDir: `${__dirname}/handler`, // your handler folder
    schemaDir: `${__dirname}/schema`, // your schema folder
    //middlewares: [], default to []
    //route: i => i default to i => i
});

server.on("error", (err) => {
    console.error(err);
});
server.on("started", () => {
    console.log("server start....");
});

server.start();
```

and run it: 
```bash
node index.js
```

done.

# To be continued
