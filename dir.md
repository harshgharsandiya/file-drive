## Backend

```
src/
│
├── app.js                 # Express app setup
├── server.js              # Server start
│
├── config/
│   ├── db.js              # Mongo connection
│   ├── redis.js
│   ├── r2.js              # Cloudflare R2 config
│   ├── rabbitmq.js
│
├── routes/
│   ├── auth.routes.js
│   ├── folder.routes.js
│   ├── file.routes.js
│   ├── share.routes.js
│   ├── search.routes.js
│   ├── trash.routes.js
│   ├── activity.routes.js
│   └── sync.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── folder.controller.js
│   ├── file.controller.js
│   ├── share.controller.js
│   ├── search.controller.js
│   ├── trash.controller.js
│   ├── activity.controller.js
│   └── sync.controller.js
│
├── services/
│   ├── auth.service.js
│   ├── folder.service.js
│   ├── file.service.js
│   ├── share.service.js
│   ├── search.service.js
│   ├── sync.service.js
│   ├── upload.service.js
│   └── permission.service.js
│
├── models/
│   ├── user.model.js
│   ├── file.model.js
│   ├── folder.model.js
│   ├── version.model.js
│   ├── share.model.js
│   ├── trash.model.js
│   └── activity.model.js
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── permission.middleware.js
│   ├── rateLimit.middleware.js
│   ├── error.middleware.js
│   └── validate.middleware.js
│
├── workers/
│   ├── thumbnail.worker.js
│   └── virusScan.worker.js
│
├── utils/
│   ├── response.js
│   ├── logger.js
│   ├── generateSignedUrl.js
│   ├── hash.js
│   └── constants.js
│
├── jobs/
    ├── cleanupTrash.job.js
    └── syncCleanup.job.js

```


## Frontend

