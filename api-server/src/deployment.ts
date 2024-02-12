import { BatchV1Api, KubeConfig } from "@kubernetes/client-node";
import { generateToken } from "./k8sTokenService";
import dotenv from "dotenv";
dotenv.config();

const {
  K8S_CLIENT_EMAIL,
  K8S_PRIVATE_KEY,
  K8S_ENDPOINT,
  CLUSTER_NAME,
  BUCKET_ACCESS_KEY,
  BUCKET_SECRET_KEY,
  BUCKET_REGION,
  BUCKET_NAME,
} = process.env;

if (
  !K8S_CLIENT_EMAIL ||
  !K8S_PRIVATE_KEY ||
  !K8S_ENDPOINT ||
  !CLUSTER_NAME ||
  !BUCKET_ACCESS_KEY ||
  !BUCKET_SECRET_KEY ||
  !BUCKET_REGION
) {
  throw new Error(
    "Please set K8S_CLIENT_EMAIL, K8S_PRIVATE_KEY, CLUSTER_NAME and K8S_ENDPOINT in environment variables"
  );
}

export const scheduleDeployment = async (gitUrl: string, projectId: string) => {
  const accessToken = await generateToken(K8S_CLIENT_EMAIL, K8S_PRIVATE_KEY);
  if (accessToken) {
    // Configure kubeConfig
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromOptions({
      clusters: [
        {
          name: CLUSTER_NAME,
          server: K8S_ENDPOINT,
          skipTLSVerify: true,
        },
      ],
      users: [
        {
          name: "user", // Provide your user name
          token: accessToken,
        },
      ],
      contexts: [
        {
          name: "context", // Provide your context name
          cluster: "build-app-cluster", // Use the cluster name defined above
          user: "user", // Use the user name defined above
        },
      ],
      currentContext: "context", // Set the current context
    });
    // Create k8s API Objects
    const k8sAPI = kubeConfig.makeApiClient(BatchV1Api);

    // Job to schedule
    const job = {
      apiVersion: "batch/v1",
      kind: "Job",
      metadata: {
        name: `build-job-${projectId}`,
      },
      spec: {
        template: {
          metadata: {
            labels: {
              app: `build-server-${projectId}`,
            },
          },
          spec: {
            containers: [
              {
                name: "build-server",
                image: "csz3qe/build-server:v1",
                env: [
                  {
                    name: "PROJECT_ID",
                    value: projectId,
                  },
                  {
                    name: "ACCESS_KEY_ID",
                    value: BUCKET_ACCESS_KEY,
                  },
                  {
                    name: "SECRET_ACCESS_KEY",
                    value: BUCKET_SECRET_KEY,
                  },
                  {
                    name: "UPLOAD_BUCKET_NAME",
                    value: BUCKET_NAME,
                  },
                  {
                    name: "REGION",
                    value: BUCKET_REGION,
                  },
                  {
                    name: "GIT_REPOSITORY__URL",
                    value: gitUrl,
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
    try {
      const createJobResponse = await k8sAPI.createNamespacedJob(
        "default",
        job
      );
      console.log("Successfully created job for projectId: " + projectId);
    } catch (error) {
      console.log("Error creating job: ", error);
    }
  } else {
    throw new Error("Unable to generate access token");
  }
};
