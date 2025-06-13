import axios from 'axios';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  timestamp: string;
}

interface SystemHealth {
  gateway: HealthStatus;
  ordenes: HealthStatus;
  calidad: HealthStatus;
  inventarios: HealthStatus;
  database: HealthStatus;
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

class HealthService {
  private baseURL = process.env.REACT_APP_API_URL ? 
    process.env.REACT_APP_API_URL.replace('/api', '') : 
    'http://localhost:3000';

  // Verificar salud del gateway/API principal
  async checkGatewayHealth(): Promise<HealthStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return {
        service: 'Gateway',
        status: 'healthy',
        message: 'Gateway is responding',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        service: 'Gateway',
        status: 'unhealthy',
        message: error.message || 'Gateway not responding',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Verificar conectividad básica
  async ping(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Verificar salud de todos los servicios
  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await axios.get(`${this.baseURL}/health/system`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      // Si no podemos obtener el estado del sistema, verificamos el gateway
      const gatewayHealth = await this.checkGatewayHealth();
      
      return {
        gateway: gatewayHealth,
        ordenes: { service: 'Ordenes', status: 'unknown', timestamp: new Date().toISOString() },
        calidad: { service: 'Calidad', status: 'unknown', timestamp: new Date().toISOString() },
        inventarios: { service: 'Inventarios', status: 'unknown', timestamp: new Date().toISOString() },
        database: { service: 'Database', status: 'unknown', timestamp: new Date().toISOString() },
        overall: gatewayHealth.status === 'healthy' ? 'degraded' : 'unhealthy',
      };
    }
  }

  // Verificar autenticación
  async checkAuth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/api/auth/verify`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new HealthService();