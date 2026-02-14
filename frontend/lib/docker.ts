import Docker from 'dockerode';

const docker = new Docker();

export interface ContainerConfig {
  image: string;
  name: string;
  port: number;  // Host port to expose
  containerPort?: number;  // Container internal port (default: 80)
  environment?: Record<string, string>;
  volumes?: Record<string, { bind: string; mode: string }>;
}

export const dockerService = {
  async buildImage(contextPath: string, dockerfile: string, tag: string): Promise<boolean> {
    try {
      const stream = await docker.buildImage(
        {
          context: contextPath,
          src: ['.']
        },
        {
          t: tag,
          dockerfile: dockerfile
        }
      );

      return new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err: any, res: any) => {
          if (err) {
            console.error('Build error:', err);
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Failed to build image:', error);
      return false;
    }
  },

  async createAndStartContainer(config: ContainerConfig): Promise<string | null> {
    try {
      // Remove existing container if exists
      try {
        const oldContainer = docker.getContainer(config.name);
        await oldContainer.stop();
        await oldContainer.remove();
      } catch (e) {
        // Container doesn't exist, ignore
      }

      // Use containerPort if specified, otherwise default to 80
      const internalPort = config.containerPort || 80;
      const portKey = `${internalPort}/tcp`;

      const container = await docker.createContainer({
        Image: config.image,
        name: config.name,
        ExposedPorts: {
          [portKey]: {}
        },
        HostConfig: {
          PortBindings: {
            [portKey]: [{ HostPort: config.port.toString() }]
          },
          RestartPolicy: {
            Name: 'unless-stopped'
          },
          Binds: config.volumes ? Object.entries(config.volumes).map(([k, v]) => `${k}:${v.bind}:${v.mode}`) : []
        },
        Env: config.environment ? Object.entries(config.environment).map(([k, v]) => `${k}=${v}`) : []
      });

      await container.start();
      return container.id;
    } catch (error) {
      console.error('Failed to create/start container:', error);
      return null;
    }
  },

  async stopContainer(containerId: string): Promise<boolean> {
    try {
      const container = docker.getContainer(containerId);
      await container.stop();
      return true;
    } catch (error) {
      console.error('Failed to stop container:', error);
      return false;
    }
  },

  async startContainer(containerId: string): Promise<boolean> {
    try {
      const container = docker.getContainer(containerId);
      await container.start();
      return true;
    } catch (error) {
      console.error('Failed to start container:', error);
      return false;
    }
  },

  async removeContainer(containerId: string): Promise<boolean> {
    try {
      const container = docker.getContainer(containerId);
      try {
        await container.stop();
      } catch (e) {
        // Already stopped
      }
      await container.remove();
      return true;
    } catch (error) {
      console.error('Failed to remove container:', error);
      return false;
    }
  },

  async getContainerLogs(containerId: string, tail: number = 100): Promise<string> {
    try {
      const container = docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        timestamps: true
      });
      return logs.toString('utf-8');
    } catch (error) {
      console.error('Failed to get container logs:', error);
      return 'Failed to retrieve logs';
    }
  },

  async getContainerStatus(containerId: string): Promise<string | null> {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      return info.State.Status;
    } catch (error) {
      return null;
    }
  }
};
