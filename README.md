# Agentic Profile Presence Service

Accepts presence notifications and signals to agents when they are nearby.


## Quickstart with Local Server

1. Ensure you have an agent for testing

	$ node scripts/setup-global-profile

2. Start the service locally

	$ yarn start

3. Try to communicate with the presence service

	$ curl -X PUT http://localhost:3004/events

    Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "secret": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

4. Execute the share-location and share-event scripts which handles the challenge and generates an authToken

    $ node scripts/share-location
    $ node scripts/share-event


## Testing the Cloud Hosted Presence Service

1. Ensure the cloud service is running.  In this example we will use the service at https://presence.p2pagentic.ai

2. Ensure you have a local "beta" profile created

	$ node scripts/setup-global-profile

4. Execute the share-location script which handles a challenge and generates an authToken

    $ node scripts/share-location -a https://presence.p2pagentic.ai/presence



## Configuring AWS Notes

1. Create a Lambda function
	- Author from scratch
	- name: agentic-profile-presence-service
	- Node 22.x
	- ARM64
	=> "Create Function"
2. Create a Custom Domain Name
	- Ensure an SSL certificate for the domain name
	- Domain name: presence.agenticprofile.ai
	- Public
	- Regional
	- ACM certificate: \*.agenticprofile.ai
	=> Click "Add domain name"
3. Configure a new HTTP API Gateway 
	- When listing APIs, click "Create API" button
	- Under HTTP API, click "Build"
	- API name: agentic-profile-presence-api
	- Integrations: Lambda
	- Lambda function: arn:aws:...:agentic-profile-presence-service
	- Version: 1.0
	- "Next"
	Configure Routes:
	- Method: ANY
	- Resource path: /{proxy+}
	Configure stages
	- name: $default
	- auto-deploy: on
4. Make sure to add AWS lambda permissions
	- On left menu, click "Integrations"
	- Expand Invoke Permissions example policy statement
	- Execute the command add "--profile agentic" (or whatever alias you have)
4. Use Route 53 to map the endpoint to the API gateway
	- Open API Gateway custom domain names
	- Find API gateway domain name
6. Make sure to add Custom domain API mapping
	- Open API Gateway custom domain names
	- Under API mappings, click "Configure API mappings"


