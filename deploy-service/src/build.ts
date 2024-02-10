import { exec } from "child_process";

export const buildCode = async (projectPath: string) => {
  return new Promise((resolve, reject) => {
    const buildProcess = exec(
      `cd ${projectPath} && npm install && npm run build`
    );

    buildProcess.stdout?.on("data", function (data) {
      console.log("stdout: " + data);
    });
    buildProcess.stderr?.on("data", function (data) {
      console.log("stderr: " + data);
    });
    buildProcess.on("close", () => {
      resolve("");
    });
  });
};
