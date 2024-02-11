const k8s = require("@kubernetes/client-node");

const kubeConfigOptions = {
  clusters: [
    {
      name: "cluster-name", // Provide your cluster name
      server: "https://<CLUSTER_ENDPOINT>", // Provide your cluster endpoint
      skipTLSVerify: true, // Set to true if your GKE cluster uses a self-signed certificate
    },
  ],
  users: [
    {
      name: "user", // Provide your user name
      authProvider: {
        name: "gcp", // Use Google Cloud Platform authentication provider
        config: {
          cmdPath: "gcloud", // Path to gcloud command
          cmdArgs: ["auth", "print-access-token"], // Command arguments
        },
      },
    },
  ],
  contexts: [
    {
      name: "context", // Provide your context name
      context: {
        cluster: "cluster-name", // Use the cluster name defined above
        user: "user", // Use the user name defined above
      },
    },
  ],
  currentContext: "context", // Set the current context
};

// Load Kubernetes configuration from options
const kc = new k8s.KubeConfig();
kc.loadFromOptions(kubeConfigOptions);

// Create Kubernetes API objects
const k8sApi = kc.makeApiClient(k8s.BatchV1Api);

// Define the Job object
const job = {
  apiVersion: "batch/v1",
  kind: "Job",
  metadata: {
    name: "build-job",
  },
  spec: {
    template: {
      metadata: {
        labels: {
          app: "build-server",
        },
      },
      spec: {
        containers: [
          {
            name: "example-container",
            image: "csz3qe/build-server:v1",
            env: [
              {
                name: "PROJECT_ID",
                value: "p1",
              },
              {
                name: "ACCESS_KEY_ID",
                value: "",
              },
              {
                name: "SECRET_ACCESS_KEY",
                value: "",
              },
              {
                name: "UPLOAD_BUCKET_NAME",
                value: "easydeploy-deployments",
              },
              {
                name: "REGION",
                value: "us-east-1",
              },
              {
                name: "GIT_REPOSITORY__URL",
                value: "https://github.com/hkirat/react-boilerplate",
              },
            ],
          },
        ],
        restartPolicy: "Never",
      },
    },
    backoffLimit: 4, // Number of retries
    activeDeadlineSeconds: 1800, // Maximum duration in seconds (30 minutes)
  },
};

// Create the Job
k8sApi
  .createNamespacedJob("default", job)
  .then((response) => {
    console.log("Job created: ", response.body.metadata.name);
  })
  .catch((err) => {
    console.error("Error creating Job: ", err);
  });
