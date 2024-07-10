import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);
import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);

import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);


import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);
import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);
import { Stack, StackProps, App, CfnOutput, Duration } from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod, HttpStage, CorsHttpMethod, ThrottleSettings } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";



const SES_REGION = process.env.AWS_REGION || "ap-southeast-2";
const SES_EMAIL_TO = process.env.npm_config_emailto || "madhan123455@gmail.com";
const SES_EMAIL_FROM = process.env.npm_config_emailfrom || "madhan@teams.tachyonsys.com.au";
const STAGE = process.env.npm_config_cognienv || "dev";
const VERSION = process.env.npm_config_cogniversion || "V0";
const NLU_API_URL = process.env.npm_config_nluurl || "http://ec2-3-27-58-135.ap-southeast-2.compute.amazonaws.com:7150";
const STT_API_URL = process.env.npm_config_stturl || "http://ec2-54-252-63-12.ap-southeast-2.compute.amazonaws.com";
const TTS_API_URL = process.env.npm_config_ttsurl || "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const SSM_TTS_API_SECRET_KEY_PATH = `/${STAGE}/tts/secretKey`;

const LAMBDA_MAX_TIMEOUT = 10;
const CGW_STATUS_READER_SERVICE_ID = "cgw-status-reader";
const CGW_STATUS_READER_ENDPOINT = "/status";
const CGW_STATUS_READERHEALTH_SERVICE_ID = "cgw-status-readerHealth";
const CGW_STATUS_READERHEALTH_ENDPOINT = "/status/health";
const CGW_CRAWLER_PROCESSOR_SERVICE_ID = "cgw-crawler-processor";
const CGW_CRAWLER_PROCESSOR_ENDPOINT = "/crawl";
const CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID = "cgw-crawler-processorHealth";
const CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT = "/crawl/health";
const CGW_FORMATTER_CORE_SERVICE_ID = "cgw-formatter-core";
const CGW_FORMATTER_CORE_ENDPOINT = "/dictate";
const CGW_FORMATTER_TABLE_SERVICE_ID = "cgw-formatter-table";
const CGW_FORMATTER_TABLE_ENDPOINT = "/dictate/table";
const CGW_BIONIC_READER_SERVICE_ID = "cgw-bionic-reader";
const CGW_BIONIC_READER_ENDPOINT = "/bionic";
const CGW_CONTENT_SCRAPPER_SERVICE_ID = "cgw-content-scrapper";
const CGW_CONTENT_SCRAPPER_ENDPOINT = "/scrap-content";
const CGW_CONTENT_READER_SERVICE_ID = "cgw-content-reader";
const CGW_CONTENT_READER_ENDPOINT = "/contents";
const CGW_SCRAPPER_PROCESSOR_SERVICE_ID = "cgw-scrapper-processor";
const CGW_SCRAPPER_PROCESSOR_ENDPOINT = "/scrap";
const CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID = "cgw-scrapper-processorHealth";
const CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT = "/scrap/health";
const CGW_JSONLD_READER_SERVICE_ID = "cgw-jsonld-reader";
const CGW_JSONLD_READER_ENDPOINT = "/jsonld";
const CGW_JSONLD_UPDATER_SERVICE_ID = "cgw-jsonld-updater";
const CGW_JSONLD_UPDATER_ENDPOINT = "/jsonld";
const CGW_JSONLD_HEALTH_SERVICE_ID = "cgw-jsonld-health";
const CGW_JSONLD_HEALTH_ENDPOINT = "/jsonld/health";
const CGW_TEMPLATE_CREATOR_SERVICE_ID = "cgw-template-creator";
const CGW_TEMPLATE_CREATOR_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_READER_SERVICE_ID = "cgw-template-reader";
const CGW_TEMPLATE_READER_ENDPOINT = "/apps/templates";
const CGW_TEMPLATE_HEALTH_SERVICE_ID = "cgw-template-health";
const CGW_TEMPLATE_HEALTH_ENDPOINT = "/apps/templates/health";
const CGW_UTTERANCE_CREATOR_SERVICE_ID = "cgw-utterance-creator";
const CGW_UTTERANCE_CREATOR_ENDPOINT = "/utterance";
const CGW_UTTERANCE_READER_SERVICE_ID = "cgw-utterance-reader";
const CGW_UTTERANCE_READER_ENDPOINT = "/utterance/query";
const CGW_UTTERANCE_READERHEALTH_SERVICE_ID = "cgw-utterance-readerHealth";
const CGW_UTTERANCE_READERHEALTH_ENDPOINT = "/utterance/query/health";
const CGW_UTTERANCE_UPDATER_SERVICE_ID = "cgw-utterance-updater";
const CGW_UTTERANCE_UPDATER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID = "cgw-utterance-deleterSpecific";
const CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT = "/utterance/specific";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID = "cgw-utternace-deleterSpecificHealth";
const CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT = "/utterance/specific/health";
const CGW_UTTERANCE_DELETER_SERVICE_ID = "cgw-utterance-deleter";
const CGW_UTTERANCE_DELETER_ENDPOINT = "/utterance";
const CGW_UTTERANCE_HEALTH_SERVICE_ID = "cgw-utterance-health";
const CGW_UTTERANCE_HEALTH_ENDPOINT = "/utterance/health";
const CGW_DICTIONARY_CORE_SERVICE_ID = "cgw-dictionary-core";
const CGW_DICTIONARY_CORE_ENDPOINT = "/dict";
const CGW_INDEXER_PROCESSOR_SERVICE_ID = "cgw-indexer-processor";
const CGW_INDEXER_PROCESSOR_ENDPOINT = "/index";
const CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID = "cgw-indexer-processorHealth";
const CGW_INDEXER_PROCESSORHEALTH_ENDPOINT = "/index/health";
const CGW_SUGGESTIONS_CORE_SERVICE_ID = "cgw-suggestions-core";
const CGW_SUGGESTIONS_CORE_ENDPOINT = "/suggestions";
const CGW_DEMO_CREATE_SERVICE_ID = "cgw-demo-create";
const CGW_DEMO_CREATE_ENDPOINT = "/auth/account/demo";
const CGW_DEMO_GETUSERDATA_SERVICE_ID = "cgw-demo-getUserData";
const CGW_DEMO_GETUSERDATA_ENDPOINT = "/demo/users";
const CGW_DEMO_LOGIN_SERVICE_ID = "cgw-demo-login";
const CGW_DEMO_LOGIN_ENDPOINT = "/auth/account/demo/login";
const CGW_DEMO_VALIDATE_SERVICE_ID = "cgw-demo-validate";
const CGW_DEMO_VALIDATE_ENDPOINT = "/auth/account/demo/validate";
const CGW_DEMO_VERIFY_SERVICE_ID = "cgw-demo-verify";
const CGW_DEMO_VERIFY_ENDPOINT = "/auth/account/demo/verify";
const CGW_DEMO_EMAILAUTOMATION_SERVICE_ID = "cgw-demo-emailAutomation";
const CGW_DEMO_EMAILAUTOMATION_ENDPOINT = "/auth/account/demo/verify/email";
const CGW_PROXY_TTS_SERVICE_ID = "cgw-proxy-tts";
const CGW_PROXY_TTS_ENDPOINT = "/tts";
const CGW_PROXY_STT_SERVICE_ID = "cgw-proxy-stt";
const CGW_PROXY_STT_ENDPOINT = "/stt";
const CGW_PROXY_STTHEALTH_SERVICE_ID = "cgw-proxy-sttHealth";
const CGW_PROXY_STTHEALTH_ENDPOINT = "/stt/health";
const CGW_PROXY_NLU_SERVICE_ID = "cgw-proxy-nlu";
const CGW_PROXY_NLU_ENDPOINT = "/nlu";
const CGW_COST_METRICS_SERVICE_ID = "cgw-cost-metrics";
const CGW_COST_METRICS_ENDPOINT = "/cost";
const CGW_SYSTEM_INFO_CREATE_SERVICE_ID = "cgw-systemInfo-create";
const CGW_SYSTEM_INFO_CREATE_ENDPOINT = "/system/info";

type ApiEndpoint = {
  method: string;
  endpoint: string;
};

const CGW_URLS: Record<string, ApiEndpoint> = {
  [CGW_STATUS_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READER_ENDPOINT,
  },
  [CGW_STATUS_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_STATUS_READERHEALTH_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CRAWLER_PROCESSOR_ENDPOINT,
  },
  [CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_CRAWLER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_FORMATTER_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_CORE_ENDPOINT,
  },
  [CGW_FORMATTER_TABLE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_FORMATTER_TABLE_ENDPOINT,
  },
  [CGW_BIONIC_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_BIONIC_READER_ENDPOINT,
  },
  [CGW_CONTENT_SCRAPPER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_SCRAPPER_ENDPOINT,
  },
  [CGW_CONTENT_READER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_CONTENT_READER_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SCRAPPER_PROCESSOR_ENDPOINT,
  },
  [CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_SCRAPPER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_JSONLD_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_READER_ENDPOINT,
  },
  [CGW_JSONLD_UPDATER_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_JSONLD_UPDATER_ENDPOINT,
  },
  [CGW_JSONLD_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_JSONLD_HEALTH_ENDPOINT,
  },
  [CGW_TEMPLATE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_TEMPLATE_CREATOR_ENDPOINT,
  },
  [CGW_TEMPLATE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_READER_ENDPOINT,
  },
  [CGW_TEMPLATE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_TEMPLATE_HEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_CREATOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_UTTERANCE_CREATOR_ENDPOINT,
  },
  [CGW_UTTERANCE_READER_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READER_ENDPOINT,
  },
  [CGW_UTTERANCE_READERHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_READERHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_UPDATER_SERVICE_ID]: {
    method: "PUT",
    endpoint: CGW_UTTERANCE_UPDATER_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETERSPECIFIC_ENDPOINT,
  },
  [CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERNACE_DELETERSPECIFICHEALTH_ENDPOINT,
  },
  [CGW_UTTERANCE_DELETER_SERVICE_ID]: {
    method: "DELETE",
    endpoint: CGW_UTTERANCE_DELETER_ENDPOINT,
  },
  [CGW_UTTERANCE_HEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_UTTERANCE_HEALTH_ENDPOINT,
  },
  [CGW_DICTIONARY_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DICTIONARY_CORE_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSOR_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_INDEXER_PROCESSOR_ENDPOINT,
  },
  [CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_INDEXER_PROCESSORHEALTH_ENDPOINT,
  },
  [CGW_SUGGESTIONS_CORE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SUGGESTIONS_CORE_ENDPOINT,
  },
  [CGW_DEMO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_CREATE_ENDPOINT,
  },
  [CGW_DEMO_GETUSERDATA_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_DEMO_GETUSERDATA_ENDPOINT,
  },
  [CGW_DEMO_LOGIN_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_LOGIN_ENDPOINT,
  },
  [CGW_DEMO_VALIDATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VALIDATE_ENDPOINT,
  },
  [CGW_DEMO_VERIFY_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_VERIFY_ENDPOINT,
  },
  [CGW_DEMO_EMAILAUTOMATION_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_DEMO_EMAILAUTOMATION_ENDPOINT,
  },
  [CGW_PROXY_TTS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_TTS_ENDPOINT,
  },
  [CGW_PROXY_STT_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_STT_ENDPOINT,
  },
  [CGW_PROXY_STTHEALTH_SERVICE_ID]: {
    method: "GET",
    endpoint: CGW_PROXY_STTHEALTH_ENDPOINT,
  },
  [CGW_PROXY_NLU_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_PROXY_NLU_ENDPOINT,
  },
  [CGW_COST_METRICS_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_COST_METRICS_ENDPOINT,
  },
  [CGW_SYSTEM_INFO_CREATE_SERVICE_ID]: {
    method: "POST",
    endpoint: CGW_SYSTEM_INFO_CREATE_ENDPOINT,
  },
};

const CGW_RESOURCE_NAME = "cgw";
const MAPPED_DOMAIN = "https://api.talksite.ai";

function getEndpointUrl(key: string) {
  return CGW_URLS[key].endpoint;
}

function getEndpointMethod(key: string) {
  return CGW_URLS[key].method;
}
export class CognitivelyWebsite extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const cgwSOTTableName = cdk.Fn.importValue(`cgwSOTTableName-${STAGE}`);
    const cgwSOT = dynamodb.Table.fromTableName(this, `cgwSOTTable-${STAGE}`, cgwSOTTableName);

    const statusTrackerTableName = cdk.Fn.importValue(`statusTrackerTableName-${STAGE}`);
    const statusTracker = dynamodb.Table.fromTableName(this, `statusTrackerTable-${STAGE}`, statusTrackerTableName);

    //demoRequest Database
    const demoRequest = new dynamodb.Table(this, `demoRequest-${STAGE}`, {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      tableName: `demoRequest-${STAGE}`,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      timeToLiveAttribute: "expirationTime",
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const demoUserTableName = cdk.Fn.importValue(`demoUserTableName-${STAGE}`);
    const demoUser = dynamodb.Table.fromTableName(this, `demoUserTable-${STAGE}`, demoUserTableName);

    const schemaIdCounterTableName = cdk.Fn.importValue(`schemaIdCounterTableName-${STAGE}`);
    const schemaIdCounter = dynamodb.Table.fromTableName(this, `schemaIdCounterTable-${STAGE}`, schemaIdCounterTableName);

    const ttsCacheTableName = cdk.Fn.importValue(`ttsCacheTableName-${STAGE}`);
    const ttsCache = dynamodb.Table.fromTableName(this, `ttsCacheTable-${STAGE}`, ttsCacheTableName);

    const cgwMetaInfoTableName = cdk.Fn.importValue(`cgwMetaInfoTableName-${STAGE}`);
    const cgwMetaInfo = dynamodb.Table.fromTableName(this, `cgwMetaInfoTable-${STAGE}`, cgwMetaInfoTableName);

    const cgwSystemInfoTableName = cdk.Fn.importValue(`cgwSystemInfoTableName-${STAGE}`);
    const cgwSystemInfoTable = dynamodb.Table.fromTableName(this, `cgwSystemInfoTable-${STAGE}`, cgwSystemInfoTableName);

    const discoveryServiceTableName = cdk.Fn.importValue(`discoveryServiceTableName-${STAGE}`);
    const discoveryService = dynamodb.Table.fromTableName(this, `discoveryService-${STAGE}`, discoveryServiceTableName);

    const voaisCustomersTableName = cdk.Fn.importValue(`voaisCustomersTableName-${STAGE}`);
    const voaisCustomersTable = dynamodb.Table.fromTableName(this, `voaisCustomersTable-${STAGE}`, voaisCustomersTableName);

    // crawler SQS Queue
    const crawlerQueue = new sqs.Queue(this, `crawlerqueue-${STAGE}`, {
      queueName: `crawlerqueue-${STAGE}.fifo`,
      fifo: true,
      visibilityTimeout: Duration.minutes(3),
    });

    //scrapper SQS Queue
    const scrapperQueue = new sqs.Queue(this, `crapperqueue-${STAGE}`, {
      queueName: `scrapperqueue-${STAGE}.fifo`,
      visibilityTimeout: Duration.minutes(3),
      fifo: true,
    });

    //Scrapper S3 Bucket
    const scrapperBucket = s3.Bucket.fromBucketName(this, "ExistingS3Bucket", `scrapperbucket-cgw-${STAGE}`);
    if (!scrapperBucket) {
      const scrapperBucket = new s3.Bucket(this, `scrapperbucket-cgw-${STAGE}`, {
        bucketName: `scrapperbucket-cgw-${STAGE}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    //Cache bucket for TTS cache
    const ttsCacheBucket = new s3.Bucket(this, `tts-cache-bucket-${STAGE}`, {
      bucketName: `tts-cache-bucket-${STAGE}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //indexer SQS Queue
    const indexerQueue = new sqs.Queue(this, `indexerqueue-${STAGE}`, {
      queueName: `indexerqueue-${STAGE}.fifo`,
      fifo: true,
    });

    //tts cache SQS Queue
    const ttsCacheQueue = new sqs.Queue(this, `ttscachequeue-${STAGE}`, {
      queueName: `ttscachequeue-${STAGE}.fifo`,
      contentBasedDeduplication: true,
      fifo: true,
    });

    //Lambda for performing authorizations
    const authHandler = new lambda.Function(this, `authHandler-${STAGE}`, {
      functionName: `authHandler-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for handling authorizations",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../ts-common-authorizer/src")),
      environment: {
        VOAIS_CUSTOMER_TABLE: voaisCustomersTable.tableName,
        DISCOVERY_SERVICE_TABLE: discoveryService.tableName,
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
        STAGE,
      },
    });

    voaisCustomersTable.grantReadData(authHandler);
    discoveryService.grantReadData(authHandler);
    cgwSystemInfoTable.grantReadData(authHandler);

    // Lambda Authorizer
    const authorizer = new HttpLambdaAuthorizer(`cgw-authorizer-${STAGE}`, authHandler, {
      resultsCacheTtl: Duration.seconds(0),
      authorizerName: `cgw-authorizer-${STAGE}`,
      responseTypes: [HttpLambdaResponseType.IAM], // Define if returns simple and/or iam response
    });

    // Http Api Gatewway
    const cgwApi = new HttpApi(this, `httpApi-cgw-csi-${STAGE}`, {
      corsPreflight: {
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
      // defaultAuthorizer: authorizer,
    });

    // cgwApi.addStage(`cgwApi-stage-${STAGE}`, {
    //   stageName: STAGE,
    //   autoDeploy: true,
    // });

    const throttleSettings: ThrottleSettings = {
      burstLimit: 1,
      rateLimit: 1,
    };

    let authorizerLayer = new lambda.LayerVersion(this, `authorizer-layer-${STAGE}`, {
      code: lambda.Code.fromAsset("../layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X],
    });

    //Lambda for reading the status
    const statusReaderLambda = new lambda.Function(this, `status-reader-${STAGE}`, {
      functionName: `status-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader/src")),
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: cgwApi.url + "/api/library/components",
        LAMBDA_NAME: "read-status",
      },
      layers: [authorizerLayer],
    });

    statusTracker.grantReadData(statusReaderLambda);
    cgwSOT.grantReadData(statusReaderLambda);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderLambdaIntegration", statusReaderLambda),
    });

    //Lambda for checking the health of status reader lambda
    const statusReaderHealth = new lambda.Function(this, `status-reader-health-${STAGE}`, {
      functionName: `status-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting status of app creation",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-status-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        STATUS_READER_NAME: statusReaderLambda.functionName,
        STATUS_READER_URL: cgwApi.url + "api/status",
      },
    });

    statusTracker.grantReadData(statusReaderHealth);
    cgwSOT.grantReadData(statusReaderHealth);
    statusReaderLambda.grantInvoke(statusReaderHealth);
    statusReaderLambda.grantInvokeUrl(statusReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_STATUS_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("statusReaderHealthIntegration", statusReaderHealth),
    });

    //Lambda for getting the crawler input and invokig crawler lambda
    const crawlerProcessor = new lambda.Function(this, `crawler-processor-${STAGE}`, {
      functionName: `crawler-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessor);
    statusTracker.grantReadWriteData(crawlerProcessor);

    const devStage = new HttpStage(this, `httpApi-cgw-csi--${STAGE}-stage`, {
      httpApi: cgwApi,
      stageName: STAGE,
      throttle: throttleSettings,
      autoDeploy: true,
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],

      integration: new HttpLambdaIntegration("crawlerProcessorIntegration", crawlerProcessor),
    });

    //Lambda for checking the health of crawler processorr lambda
    const crawlerProcessorHealth = new lambda.Function(this, `crawler-processor-health-${STAGE}`, {
      functionName: `crawler-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for posting url to crawler queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-crawler-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        CRAWLER_QUEUE: crawlerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        CRAWLER_PROCESSOR_NAME: crawlerProcessor.functionName,
        CRAWLER_PROCESSOR_URL: cgwApi.url + "api/crawl",
      },
    });

    crawlerQueue.grantSendMessages(crawlerProcessorHealth);
    statusTracker.grantReadWriteData(crawlerProcessorHealth);
    crawlerProcessor.grantInvoke(crawlerProcessorHealth);
    crawlerProcessor.grantInvokeUrl(crawlerProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CRAWLER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],

      integration: new HttpLambdaIntegration("crawlerProcessorHealthIntegration", crawlerProcessorHealth),
    });

    //Lambda function-cgw-crawler
    const crawler = new PythonFunction(this, `crawler-${STAGE}`, {
      functionName: `crawler-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      maxEventAge: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for crawling the given url and posting crawled data to scrapper queue",
      entry: path.join(__dirname, "../lambda/cgw-crawler-sitemap-py/src"),
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event Triggered",
      },
    });

    crawler.addEventSource(
      new SqsEventSource(crawlerQueue, {
        batchSize: 10,
      })
    );

    statusTracker.grantReadWriteData(crawler);
    cgwSOT.grantReadWriteData(crawler);
    crawlerQueue.grantConsumeMessages(crawler);
    scrapperQueue.grantSendMessages(crawler);

    //Lambda function cgw-formatter
    const formatter = new PythonFunction(this, `formatter-${STAGE}`, {
      functionName: `formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-formatter/src"),
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantWriteData(formatter);
    cgwMetaInfo.grantReadData(formatter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("formatterIntegration", formatter),
    });

    //Lambda function cgw-table-formatter
    const tableFormatter = new PythonFunction(this, `table-formatter-${STAGE}`, {
      functionName: `table-formatter-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for formatting the tables in the html file",
      entry: path.join(__dirname, "../lambda/cgw-table-formatter/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_FORMATTER_TABLE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("tableFormatterIntegration", tableFormatter),
    });

    //Lambda function cgw-bionic-reader
    const bionicReader = new PythonFunction(this, `bionicReader-${STAGE}`, {
      functionName: `bionicReader-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for creating the bionic formatted html file",
      entry: path.join(__dirname, "../lambda/cgw-bionic-reader/src"),
      environment: {},
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_BIONIC_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("bionicReaderIntegration", bionicReader),
    });

    const contentScrapper = new PythonFunction(this, `content-scrapper-${STAGE}`, {
      functionName: `content-scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      handler: "handler",
      retryAttempts: 0,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(3),
      description: "Lambda for scraping the content of the given web page",
      entry: path.join(__dirname, "../lambda/cgw-content-scrapper/src"),
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_SCRAPPER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentScrapperIntegration", contentScrapper),
    });

    cgwSOT.grantWriteData(contentScrapper);

    const contentReader = new lambda.Function(this, `content-reader-${STAGE}`, {
      functionName: `content-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(3),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting scraped contents from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-content-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_CONTENT_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("contentReaderIntegration", contentReader),
    });
    cgwSOT.grantReadData(contentReader);

    //lambda function-cgw-scrapper-processor
    const scrapperProcessor = new lambda.Function(this, `scrapper-Processor-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting pageUrl to scrapper queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessor);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("scrapperProcessorIntegration", scrapperProcessor),
    });

    //lambda function-cgw-scrapper-processor
    const scrapperProcessorHealth = new lambda.Function(this, `scrapper-Processor-health-${STAGE}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      functionName: `scrapper-processor-health-${STAGE}`,
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the scrapper processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-scrapper-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        SCRAPPER_QUEUE_URL: scrapperQueue.queueUrl,
        SCRAPPER_BUCKET: scrapperBucket.bucketName,
        STATUS_TRACKER: statusTracker.tableName,
        SCRAPPER_PROCESSOR_NAME: scrapperProcessor.functionName,
        SCRAPPER_PROCESSOR_URL: cgwApi.url + "api/scrap",
      },
    });
    scrapperQueue.grantSendMessages(scrapperProcessorHealth);
    statusTracker.grantReadWriteData(scrapperProcessorHealth);
    scrapperBucket.grantPut(scrapperProcessorHealth);
    scrapperProcessor.grantInvoke(scrapperProcessorHealth);
    scrapperProcessor.grantInvokeUrl(scrapperProcessorHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SCRAPPER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("scrapperProcessorHealthIntegration", scrapperProcessorHealth),
    });

    // lambda function-cgw-scrapper
    const scrapper = new PythonFunction(this, `scrapper-${STAGE}`, {
      functionName: `scrapper-${STAGE}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      index: "index.py",
      timeout: Duration.minutes(3),
      handler: "handler",
      description: "Lambda for scrapping the input pageUrl and posting data to indexer queue",
      entry: path.join(__dirname, "../lambda/cgw-scrapper/src"),
      environment: {
        INDEXER_QUEUE: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        MFC_LIST_URL: "Event triggered",
      },
    });

    scrapper.addEventSource(
      new SqsEventSource(scrapperQueue, {
        batchSize: 3,
      })
    );

    scrapperQueue.grantConsumeMessages(scrapper);
    indexerQueue.grantSendMessages(scrapper);
    cgwSOT.grantWriteData(scrapper);

    const jsonldReader = new lambda.Function(this, `jsonld-reader-${STAGE}`, {
      functionName: `jsonld-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        JSONLD_READER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadData(jsonldReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldReaderIntegration", jsonldReader),
    });

    const jsonldUpdater = new lambda.Function(this, `jsonld-updater-${STAGE}`, {
      functionName: `jsonld-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for updating JSON-LD from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_UPDATER_URL: cgwApi.url + "/api/jsonld",
      },
    });

    cgwSOT.grantReadWriteData(jsonldUpdater);
    schemaIdCounter.grantReadWriteData(jsonldUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_UPDATER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("jsonldUpdaterIntegration", jsonldUpdater),
    });

    const jsonldHealth = new lambda.Function(this, `jsonld-health-${STAGE}`, {
      functionName: `jsonld-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the jsonld updater api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-jsonld-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SCHEMA_ID_COUNTER_TABLE_NAME: schemaIdCounter.tableName,
        JSONLD_READER_NAME: jsonldReader.functionName,
        JSONLD_READER_URL: cgwApi.url + "api/jsonld",
        JSONLD_READER_HTTP_METHOD: "GET",
        JSONLD_UPDATER_NAME: jsonldUpdater.functionName,
        JSONLD_UPDATER_URL: cgwApi.url + "api/jsonld",
        JSONLD_UPDATER_HTTP_METHOD: "POST",
      },
    });

    cgwSOT.grantReadWriteData(jsonldHealth);
    schemaIdCounter.grantReadWriteData(jsonldHealth);
    jsonldReader.grantInvoke(jsonldHealth);
    jsonldReader.grantInvokeUrl(jsonldHealth);
    jsonldUpdater.grantInvoke(jsonldHealth);
    jsonldUpdater.grantInvokeUrl(jsonldHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_JSONLD_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("jsonldHealthIntegration", jsonldHealth),
    });

    const templateCreator = new lambda.Function(this, `template-creator-${STAGE}`, {
      functionName: `template-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantWriteData(templateCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("templateCreatorIntegration", templateCreator),
    });

    const templateReader = new lambda.Function(this, `template-reader-${STAGE}`, {
      functionName: `template-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading JSON-LD template",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_READER_URL: cgwApi.url + "/api/apps/templates",
      },
    });

    cgwSOT.grantReadData(templateReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_READER_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateReaderIntegration", templateReader),
    });

    const templateHealth = new lambda.Function(this, `template-health-${STAGE}`, {
      functionName: `template-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the template api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-template-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        TEMPLATE_CREATOR_NAME: templateCreator.functionName,
        TEMPLATE_CREATOR_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_CREATOR_HTTP_METHOD: "POST",
        TEMPLATE_READER_NAME: templateReader.functionName,
        TEMPLATE_READER_URL: cgwApi.url + "api/apps/templates",
        TEMPLATE_READER_HTTP_METHOD: "GET",
      },
    });

    cgwSOT.grantReadWriteData(templateHealth);
    templateCreator.grantInvoke(templateHealth);
    templateCreator.grantInvokeUrl(templateHealth);
    templateReader.grantInvoke(templateHealth);
    templateReader.grantInvokeUrl(templateHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_TEMPLATE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("templateHealthIntegration", templateHealth),
    });

    //Lambda for storing user utterances
    const utteranceCreator = new lambda.Function(this, `utterance-creator-${STAGE}`, {
      functionName: `utterance-creator-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for storing user utterances in cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-creator/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceCreator);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_CREATOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceCreatorIntegration", utteranceCreator),
    });

    //Lambda for reading user utterances
    const utteranceReader = new lambda.Function(this, `utterance-reader-${STAGE}`, {
      functionName: `utterance-reader-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for reading user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_URL: cgwApi.url + "/api/utterance/query",
      },
    });

    cgwSOT.grantReadData(utteranceReader);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READER_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("utteranceReaderIntegration", utteranceReader),
    });

    //Lambda for deleting user utterances
    const utteranceReaderHealth = new lambda.Function(this, `utterance-reader-health-${STAGE}`, {
      functionName: `utterance-reader-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance reader api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-reader-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_READER_NAME: utteranceReader.functionName,
        UTTERANCE_READER_URL: cgwApi.url + "api/utterance/query",
      },
    });

    cgwSOT.grantReadWriteData(utteranceReaderHealth);
    utteranceReader.grantInvoke(utteranceReaderHealth);
    utteranceReader.grantInvokeUrl(utteranceReaderHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_READERHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceReaderHealthIntegration", utteranceReaderHealth),
    });

    //Lambda for updating user utterances
    const utteranceUpdater = new lambda.Function(this, `utterance-updater-${STAGE}`, {
      functionName: `utterance-updater-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for updating user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-updater/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantReadWriteData(utteranceUpdater);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_UPDATER_SERVICE_ID),
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("utteranceUpdaterIntegration", utteranceUpdater),
    });

    //Lambda for updating user utterances
    const specificUtteranceDeleter = new lambda.Function(this, `specific-utterance-deleter-${STAGE}`, {
      functionName: `specific-utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting a specific utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETERSPECIFIC_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterIntegration", specificUtteranceDeleter),
    });

    const specificUtteranceDeleterHealth = new lambda.Function(this, `specific-utterance-deleter-health-${STAGE}`, {
      functionName: `specific-utterance-deleter-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for testing specific utterance deleter resources",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-specific-utterance-deleter-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        SPECIFIC_UTTERANCE_DELETER_NAME: specificUtteranceDeleter.functionName,
        SPECIFIC_UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance/specific",
      },
    });

    cgwSOT.grantReadWriteData(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvoke(specificUtteranceDeleterHealth);
    specificUtteranceDeleter.grantInvokeUrl(specificUtteranceDeleterHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERNACE_DELETERSPECIFICHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("specificUtteranceDeleterHealthIntegration", specificUtteranceDeleterHealth),
    });

    //Lambda for deleting user utterances
    const utteranceDeleter = new lambda.Function(this, `utterance-deleter-${STAGE}`, {
      functionName: `utterance-deleter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for deleting user utterances from cgwSOT",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-deleter/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_DELETER_URL: cgwApi.url + "/api/utterance",
      },
    });

    cgwSOT.grantWriteData(utteranceDeleter);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_DELETER_SERVICE_ID),
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration("utteranceDeleterIntegration", utteranceDeleter),
    });

    //Lambda for deleting user utterances
    const utteranceHealth = new lambda.Function(this, `utterance-health-${STAGE}`, {
      functionName: `utterance-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking health of the utterance api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-utterance-health/src")),
      layers: [authorizerLayer],
      environment: {
        cgwSOT: cgwSOT.tableName,
        UTTERANCE_CREATOR_NAME: utteranceCreator.functionName,
        UTTERANCE_CREATOR_URL: cgwApi.url + "api/utterance",
        UTTERANCE_CREATOR_HTTP_METHOD: "POST",
        UTTERANCE_UPDATER_NAME: utteranceUpdater.functionName,
        UTTERANCE_UPDATER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_UPDATER_HTTP_METHOD: "PUT",
        UTTERANCE_DELETER_NAME: utteranceDeleter.functionName,
        UTTERANCE_DELETER_URL: cgwApi.url + "api/utterance",
        UTTERANCE_DELETER_HTTP_METHOD: "DELETE",
      },
    });

    cgwSOT.grantReadWriteData(utteranceHealth);
    utteranceCreator.grantInvoke(utteranceHealth);
    utteranceCreator.grantInvokeUrl(utteranceHealth);
    utteranceUpdater.grantInvoke(utteranceHealth);
    utteranceUpdater.grantInvokeUrl(utteranceHealth);
    utteranceDeleter.grantInvoke(utteranceHealth);
    utteranceDeleter.grantInvokeUrl(utteranceHealth);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_UTTERANCE_HEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("utteranceHealthIntegration", utteranceHealth),
    });

    //Lambda for deleting user utterances
    const dictionary = new lambda.Function(this, `dictionary-${STAGE}`, {
      functionName: `dictionary-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for getting meaning of random words",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-dictionary/src")),
      memorySize: 256,
      layers: [authorizerLayer],
      environment: {
        DICTIONARY_URL: cgwApi.url + "/api/dict",
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DICTIONARY_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("dictionaryIntegration", dictionary),
    });

    // Lambda function-cgw-indexer-processor
    const indexerProcessor = new lambda.Function(this, `indexer-processor-${STAGE}`, {
      functionName: `indexer-processor-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for posting scrapped data to indexer queue",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "/api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessor);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSOR_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("indexerProcessorIntegration", indexerProcessor),
    });

    const indexerProcessorHealth = new lambda.Function(this, `indexer-processor-health-${STAGE}`, {
      functionName: `indexer-processor-health-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer-processor-health/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE_URL: indexerQueue.queueUrl,
        STATUS_TRACKER: statusTracker.tableName,
        INDEXER_PROCESSOR_NAME: indexerProcessor.functionName,
        INDEXER_PROCESSOR_URL: cgwApi.url + "api/index",
      },
    });

    indexerQueue.grantSendMessages(indexerProcessorHealth);
    statusTracker.grantReadWriteData(indexerProcessorHealth);
    indexerProcessor.grantInvoke(indexerProcessorHealth);
    indexerProcessor.grantInvokeUrl(indexerProcessorHealth);

    //API for Indexer-Processor
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_INDEXER_PROCESSORHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("indexerProcessorHealthIntegration", indexerProcessorHealth),
    });

    const suggestions = new lambda.Function(this, `get-suggestions-${STAGE}`, {
      functionName: `get-suggestions-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for checking health of the indexer processor api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-suggestions/src")),
      layers: [authorizerLayer],
      environment: {},
    });

    //API for suggestions
    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SUGGESTIONS_CORE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("suggestionsIntegration", suggestions),
    });

    // Lambda function-cgw-indexer
    const indexer = new lambda.Function(this, `indexer-${STAGE}`, {
      functionName: `indexer-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for indexing scraped data to opensearch",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-indexer/src")),
      layers: [authorizerLayer],
      environment: {
        INDEXER_QUEUE: indexerQueue.queueName,
        STATUS_TRACKER: statusTracker.tableName,
        cgwSOT: cgwSOT.tableName,
        INDEXER_URL: "Event triggered",
      },
    });

    indexer.addEventSource(
      new SqsEventSource(indexerQueue, {
        batchSize: 3,
      })
    );

    const createDemoAccount = new lambda.Function(this, `create-demo-account-${STAGE}`, {
      functionName: `create-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createDemoAccountIntegration", createDemoAccount),
    });

    demoRequest.grantReadWriteData(createDemoAccount);
    demoUser.grantReadWriteData(createDemoAccount);

    const getDemoUserData = new lambda.Function(this, `get-demo-user-data-${STAGE}`, {
      functionName: `get-demo-user-data-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for getting demo user data",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-get-demo-user-data/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_USERS_TABLE: demoUser.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_GETUSERDATA_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("getDemoUserDataIntegration", getDemoUserData),
    });

    demoUser.grantReadWriteData(getDemoUserData);

    const loginDemoAccount = new lambda.Function(this, `login-demo-account-${STAGE}`, {
      functionName: `login-demo-account-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for logging in to demo account",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-login-demo-account/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_LOGIN_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("loginDemoAccountIntegration", loginDemoAccount),
    });

    demoRequest.grantReadWriteData(loginDemoAccount);

    const validateSession = new lambda.Function(this, `validate-session-${STAGE}`, {
      functionName: `validate-session-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-validate-session/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VALIDATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("validateSessionIntegration", validateSession),
    });

    demoRequest.grantReadData(validateSession);

    const demoAccountDynamoDBStream = new lambda.Function(this, `demo-account-dynamodb-stream-${STAGE}`, {
      functionName: `demo-account-dynamodb-stream-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-demo-account-dynamodb-stream/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    demoAccountDynamoDBStream.addEventSource(
      new DynamoEventSource(demoRequest, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    demoRequest.grantReadWriteData(demoAccountDynamoDBStream);

    const verifyEmail = new lambda.Function(this, `verify-email-${STAGE}`, {
      functionName: `verify-email-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for validating user session",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-verify-email/src")),
      layers: [authorizerLayer],
      environment: {
        DEMO_REQUEST_TABLE: demoRequest.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_VERIFY_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("verifyEmailIntegration", verifyEmail),
    });

    demoRequest.grantReadWriteData(verifyEmail);

    const emailAutomation = new lambda.Function(this, `emailAutomation-${STAGE}`, {
      functionName: `emailAutomation-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for sending email to demo users email verification",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-email-automation/src")),
      layers: [authorizerLayer],
      environment: {
        SES_EMAIL_FROM,
        SES_EMAIL_TO,
      },
    });

    // 👇 Add permissions to the Lambda function to send Emails
    emailAutomation.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
        resources: ["*"],
      })
    );

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_DEMO_EMAILAUTOMATION_SERVICE_ID), // define a constant for path
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("emailAutomationIntegration", emailAutomation),
    });

    const lambdaARole = new iam.Role(this, "LambdaRole-SystemManagerGetAccess", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaARole.addToPolicy(
      new PolicyStatement({
        resources: ["*"],
        actions: ["ssm:GetParameter", "logs:*"],
      })
    );

    const proxyTTS = new lambda.Function(this, `proxyTTS-${STAGE}`, {
      functionName: `proxyTTS-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      role:lambdaARole,
      description: "Lambda for accessing external TTS api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-tts/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_API_URL: TTS_API_URL,
        TTS_CACHE_TABLE: ttsCache.tableName,
        TTS_CACHE_QUEUE_URL: ttsCacheQueue.queueUrl,
        TTS_CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
        META_INFO_TABLE_NAME: cgwMetaInfo.tableName,
        SSM_TTS_API_SECRET_KEY_PATH
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_TTS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyTTSIntegration", proxyTTS),
    });
    ttsCache.grantReadWriteData(proxyTTS);
    ttsCacheBucket.grantRead(proxyTTS);
    ttsCacheQueue.grantSendMessages(proxyTTS);
    cgwMetaInfo.grantReadData(proxyTTS);

    const ttsCacheWriter = new lambda.Function(this, `ttsCacheWriter-${STAGE}`, {
      functionName: `ttsCacheWriter-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      description: "Lambda for caching TTS api response",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-tts-cache-writer/src")),
      layers: [authorizerLayer],
      environment: {
        TTS_CACHE_TABLE: ttsCache.tableName,
        CACHE_BUCKET_NAME: ttsCacheBucket.bucketName,
      },
    });

    ttsCacheWriter.addEventSource(
      new SqsEventSource(ttsCacheQueue, {
        batchSize: 1,
      })
    );

    ttsCache.grantWriteData(ttsCacheWriter);
    ttsCacheBucket.grantWrite(ttsCacheWriter);

    const s3PolicyStatement = new PolicyStatement({
      actions: ["s3:*"],
      resources: ["arn:aws:s3:::*"],
    });

    ttsCacheWriter.role?.addToPrincipalPolicy(s3PolicyStatement);
    proxyTTS.role?.addToPrincipalPolicy(s3PolicyStatement);

    const proxySTT = new lambda.Function(this, `proxySTT-${STAGE}`, {
      functionName: `proxySTT-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for accessing external STT api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STT_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxySTTIntegration", proxySTT),
    });

    const proxySTTHealth = new lambda.Function(this, `proxySTTHealth-${STAGE}`, {
      functionName: `proxySTTHealth-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.minutes(5),
      description: "Lambda for checking STT api health",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-stt/src")),
      layers: [authorizerLayer],
      environment: {
        STT_API_URL: STT_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_STTHEALTH_SERVICE_ID),
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("proxySTTHealthIntegration", proxySTTHealth),
    });

    const proxyNLU = new lambda.Function(this, `proxyNLU-${STAGE}`, {
      functionName: `proxyNLU-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-proxy-nlu/src")),
      layers: [authorizerLayer],
      environment: {
        NLU_API_URL: NLU_API_URL,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_PROXY_NLU_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("proxyNLUIntegration", proxyNLU),
    });

    const costMetricsApi = new lambda.Function(this, `costMetricsApi-${STAGE}`, {
      functionName: `costMetricsApi-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      timeout: Duration.seconds(LAMBDA_MAX_TIMEOUT),
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for accessing external nlu api",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-cost-metrics/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_META_INFO_TABLE: cgwMetaInfo.tableName,
      },
    });

    cgwMetaInfo.grantReadData(costMetricsApi);

    costMetricsApi.role?.addToPrincipalPolicy(s3PolicyStatement);

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_COST_METRICS_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("costMetricsApiIntegration", costMetricsApi),
    });

    //Lambda for creating  cgw system information
    const createSystemInfo = new lambda.Function(this, `create-system-info-${STAGE}`, {
      functionName: `create-system-info-${STAGE}`,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      description: "Lambda for creating cgw system information",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/cgw-create-system-info/src")),
      layers: [authorizerLayer],
      environment: {
        CGW_SYSTEM_INFO_TABLE: cgwSystemInfoTable.tableName,
      },
    });

    cgwApi.addRoutes({
      path: getEndpointUrl(CGW_SYSTEM_INFO_CREATE_SERVICE_ID),
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("createSystemInfoIntegration", createSystemInfo),
    });
    cgwSystemInfoTable.grantReadWriteData(createSystemInfo);

    function transformSortKey(serviceCode: string) {
      const parts = serviceCode.split("-");
      const service = "SERVICE_" + parts[0].toUpperCase();
      const resource = "RESOURCE_" + parts[1].toUpperCase();
      const operation = "OPERATION_" + parts[2].toUpperCase();
      const version = "VERSION_" + VERSION;

      return `${service}#${resource}#${operation}#${version}`;
    }

    let serviceNameArray = Object.keys(CGW_URLS);

    let serviceIdParams = {
      TableName: discoveryService.tableName,
      Item: {
        pk: { S: "SERVICE_IDS" },
        sk: { S: "CGW" },
        serviceIds: {
          SS: serviceNameArray,
        },
        
        creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
      },
    };
    new cr.AwsCustomResource(this, `postDiscoveryServices`, {
      onUpdate: {
        service: "DynamoDB",
        action: "putItem",
        parameters: serviceIdParams,
        physicalResourceId: cr.PhysicalResourceId.of(`discoveryServices`),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    for (let index = 0; index < serviceNameArray.length; index++) {
      let params = {
        TableName: discoveryService.tableName,
        Item: {
          pk: { S: "SERVICES" },
          sk: { S: transformSortKey(serviceNameArray[index]) },
          serviceId: { S: serviceNameArray[index] },
          url: {
            S: cgwApi.url + getEndpointUrl(serviceNameArray[index]).substring(1),
          },
          method: {
            S: getEndpointMethod(serviceNameArray[index]),
          },
          resource: {
            S: CGW_RESOURCE_NAME,
          },
          mappedUrl: {
            S: `${MAPPED_DOMAIN}/${CGW_RESOURCE_NAME}${getEndpointUrl(serviceNameArray[index])}`,
          },
          creationDateTime: { N: Math.floor(new Date().getTime() / 1000).toString() },
        },
      };
      new cr.AwsCustomResource(this, `postDiscoveryServiceData-${index}`, {
        onUpdate: {
          service: "DynamoDB",
          action: "putItem",
          parameters: params,
          physicalResourceId: cr.PhysicalResourceId.of(`discoveryDataCreator-${index}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      });
    }

    //CFN output of http Api
    const httpOutput = new CfnOutput(this, `Cognitively.website Api Gateway Endpoint-${STAGE}`, {
      value: cgwApi.url!,
      exportName: `cgwApiGateway-${STAGE}`,
    });

    const stageOutput = new CfnOutput(this, `Cognitively.website Api Gateway ${STAGE} Stage`, {
      value: devStage.stageName,
      exportName: `cgwApiGateway${STAGE}Stage`,
    });

    const httpApiIdOutput = new CfnOutput(this, `Cognitively.website Api Gateway Api Id-${STAGE}`, {
      value: cgwApi.apiId,
      exportName: `cgwApiGatewayApiId-${STAGE}`,
    });

    //CFN output of http Api
    //     const metaInfoTableName = new CfnOutput(this, `metaInfoTableName-${STAGE}`, {
    //       value: cgwMetaInfo.tableName,
    //       exportName: `metaInfoTableName-${STAGE}`,
    //     });

    //     //CFN output of http Api
    //  new CfnOutput(this, `cgwSystemInfoTableName-${STAGE}`, {
    //       value: cgwSystemInfoTable.tableName,
    //       exportName: `cgwSystemInfoTableName-${STAGE}`,
    //     });
  }
}

const app = new cdk.App();
new CognitivelyWebsite(app, `cgw-services-${STAGE}`);
