[![License: Apache2](https://img.shields.io/badge/License-Apache2-green.svg)](https://opensource.org/licenses/Apache-2.0)
# A Stripe x SAP Business ByDesign integration using [AWS SAM](https://aws.amazon.com/serverless/sam/)
[![](https://i.imgur.com/uwpTfCB.png)](https://i.imgur.com/uwpTfCB.png)

## Description
This application monitore the release of Sales Orders in SAP Business ByDesign and process the payments with Stripe. It works by pulling data, every minute, from OData services and checking if there were changes. It has a serverless, loosely coupled architecture and has been implemented using [AWS Serverless Application Model](https://aws.amazon.com/serverless/sam/).


## Requirments
* [A free Stripe Account](https://dashboard.stripe.com/)
* AWS Account (free tier will do it)
* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* SAP Business ByDesign Tenant
* These [ByD Custom Odata Services](https://github.com/SAP-samples/sapbydesign-api-samples/), [Sales Orders](https://github.com/SAP-samples/sapbydesign-api-samples/blob/master/Custom%20OData%20Services/khsalesorder.xml), [Outbound Delivery Requests](https://github.com/SAP-samples/sapbydesign-api-samples/blob/master/Custom%20OData%20Services/khoutbounddeliveryrequest.xml) and, [Outbound Deliveries](https://github.com/SAP-samples/sapbydesign-api-samples/blob/master/Custom%20OData%20Services/khoutbounddelivery.xml)

## Deployment
Clone or download this repository:
```bash
git clone https://github.com/B1SA/byd-stripe.git
```
Update the environment variables located on the [template.yaml](template.yaml) file. With the Stripe Keys and ByD Credentials.

From its root folder, build and deploy it to your account.
```bash
sam build
sam deploy --guided
```
For details on how to deploy/test it locally check [README-SAM](README-SAM.md)
 
## Support and Contributions
This repository is provided "as-is". No support is available. Feel free to open issues or provide pull requests.

## License
This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.

