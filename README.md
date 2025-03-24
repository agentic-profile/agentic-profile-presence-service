# Agentic Profile Presence Service

Accepts presence notifications and signals to agents when they are nearby.

## Configuring AWS

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


