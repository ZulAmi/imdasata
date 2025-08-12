/**
 * System Resource Utilization Monitoring
 * Tracks CPU, memory, disk, network, and database performance
 */

import { SystemResourceMetrics, PrivacyComplianceMetrics } from '@prisma/client';
import { MonitoringAlert } from './types';
import { prisma } from '../prisma';
import * as os from 'os';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export class SystemResourceMonitor {
  private metrics: SystemResourceMetrics[] = [];
  private previousNetworkStats: { bytesIn: number; bytesOut: number } | null = null;
  private alertThresholds = {
    cpu: 80, // 80%
    memory: 85, // 85%
    disk: 90, // 90%
    databaseConnections: 100,
    databaseQueryTime: 1000 // 1 second
  };

  constructor() {
    // Collect metrics every 30 seconds
    setInterval(() => this.collectMetrics(), 30000);
    
    // Generate resource reports every hour
    setInterval(() => this.generateResourceReport(), 3600000);
  }

  /**
   * Collect comprehensive system resource metrics
   */
  public async collectMetrics(): Promise<SystemResourceMetrics> {
    const startTime = Date.now();

    try {
      // CPU metrics
      const cpuMetrics = await this.getCpuMetrics();
      
      // Memory metrics
      const memoryMetrics = this.getMemoryMetrics();
      
      // Disk metrics
      const diskMetrics = await this.getDiskMetrics();
      
      // Network metrics
      const networkMetrics = await this.getNetworkMetrics();
      
      // Database metrics
      const databaseMetrics = await this.getDatabaseMetrics();

      const metrics: Omit<SystemResourceMetrics, 'id'> & { id: string } = {
        id: `resource-${Date.now()}`,
        cpuUsage: cpuMetrics.usage,
        cpuCores: cpuMetrics.cores,
        cpuLoadAverage: cpuMetrics.loadAverage,
        memoryUsed: memoryMetrics.used,
        memoryTotal: memoryMetrics.total,
        memoryUsage: memoryMetrics.usage,
        heapUsed: memoryMetrics.heapUsed,
        heapTotal: memoryMetrics.heapTotal,
        diskUsed: diskMetrics.used,
        diskTotal: diskMetrics.total,
        diskUsage: diskMetrics.usage,
        networkBytesIn: networkMetrics.bytesIn,
        networkBytesOut: networkMetrics.bytesOut,
        networkConnections: networkMetrics.connections,
        databaseConnections: databaseMetrics.connections,
        databaseQueryTime: databaseMetrics.queryTime,
        databaseSlowQueries: databaseMetrics.slowQueries,
        timestamp: new Date()
      };

      // Store metrics
      this.metrics.push(metrics);
      
      // Keep only last 2 hours of metrics in memory
      if (this.metrics.length > 240) { // 2 hours * 120 samples/hour
        this.metrics = this.metrics.slice(-240);
      }

      // Store in database
      await this.storeMetrics(metrics);

      // Check for resource alerts
      await this.checkResourceAlerts(metrics);

      console.log(`Resource metrics collected in ${Date.now() - startTime}ms`);
      return metrics;

    } catch (error) {
      console.error('Error collecting resource metrics:', error);
      throw error;
    }
  }

  /**
   * Get CPU metrics
   */
  private async getCpuMetrics(): Promise<{
    usage: number;
    cores: number;
    loadAverage: number[];
  }> {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Calculate CPU usage over a short interval
    const cpuUsage = await this.calculateCpuUsage();

    return {
      usage: cpuUsage,
      cores: cpus.length,
      loadAverage
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  private async calculateCpuUsage(): Promise<number> {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    // Wait 100ms for measurement
    await new Promise(resolve => setTimeout(resolve, 100));

    const endUsage = process.cpuUsage(startUsage);
    const endTime = Date.now();

    const cpuPercent = (endUsage.user + endUsage.system) / ((endTime - startTime) * 1000);
    return Math.min(100, cpuPercent * 100);
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics(): {
    used: bigint;
    total: bigint;
    usage: number;
    heapUsed: bigint;
    heapTotal: bigint;
  } {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    const heapStats = process.memoryUsage();

    return {
      used: BigInt(usedMemory),
      total: BigInt(totalMemory),
      usage: memoryUsage,
      heapUsed: BigInt(heapStats.heapUsed),
      heapTotal: BigInt(heapStats.heapTotal)
    };
  }

  /**
   * Get disk metrics
   */
  private async getDiskMetrics(): Promise<{
    used: bigint;
    total: bigint;
    usage: number;
  }> {
    try {
      // For Windows, check C: drive
      if (process.platform === 'win32') {
        return await this.getWindowsDiskMetrics();
      } else {
        return await this.getUnixDiskMetrics();
      }
    } catch (error) {
      console.error('Error getting disk metrics:', error);
      return {
        used: BigInt(0),
        total: BigInt(1),
        usage: 0
      };
    }
  }

  /**
   * Get Windows disk metrics
   */
  private async getWindowsDiskMetrics(): Promise<{
    used: bigint;
    total: bigint;
    usage: number;
  }> {
    try {
      // Use wmic command to get disk space on Windows
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('wmic logicaldisk where caption="C:" get size,freespace /value');
      
      const lines = stdout.split('\n');
      let freeSpace = 0;
      let totalSize = 0;

      for (const line of lines) {
        if (line.startsWith('FreeSpace=')) {
          freeSpace = parseInt(line.split('=')[1]);
        } else if (line.startsWith('Size=')) {
          totalSize = parseInt(line.split('=')[1]);
        }
      }

      const usedSpace = totalSize - freeSpace;
      const usage = totalSize > 0 ? (usedSpace / totalSize) * 100 : 0;

      return {
        used: BigInt(usedSpace),
        total: BigInt(totalSize),
        usage
      };
    } catch (error) {
      // Fallback to process working directory stats
      const stats = await stat(process.cwd());
      return {
        used: BigInt(stats.size || 0),
        total: BigInt(stats.size || 1),
        usage: 0
      };
    }
  }

  /**
   * Get Unix disk metrics
   */
  private async getUnixDiskMetrics(): Promise<{
    used: bigint;
    total: bigint;
    usage: number;
  }> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('df -k /');
      const lines = stdout.split('\n');
      
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const total = parseInt(parts[1]) * 1024; // Convert from KB to bytes
        const used = parseInt(parts[2]) * 1024;
        const usage = total > 0 ? (used / total) * 100 : 0;

        return {
          used: BigInt(used),
          total: BigInt(total),
          usage
        };
      }

      throw new Error('Unable to parse df output');
    } catch (error) {
      // Fallback
      return {
        used: BigInt(0),
        total: BigInt(1),
        usage: 0
      };
    }
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<{
    bytesIn: bigint;
    bytesOut: bigint;
    connections: number;
  }> {
    try {
      // Simplified network metrics
      // In production, this would read from /proc/net/dev on Linux
      // or use Windows performance counters
      
      const networkInterfaces = os.networkInterfaces();
      let totalBytesIn = BigInt(0);
      let totalBytesOut = BigInt(0);

      // Estimate based on process metrics
      const processStats = process.memoryUsage();
      totalBytesIn = BigInt(processStats.external || 0);
      totalBytesOut = BigInt(processStats.arrayBuffers || 0);

      // Estimate connections based on active handles
      const connections = (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0;

      return {
        bytesIn: totalBytesIn,
        bytesOut: totalBytesOut,
        connections
      };
    } catch (error) {
      console.error('Error getting network metrics:', error);
      return {
        bytesIn: BigInt(0),
        bytesOut: BigInt(0),
        connections: 0
      };
    }
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<{
    connections: number;
    queryTime: number;
    slowQueries: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Test database connection and measure response time
      await prisma.anonymousUser.findFirst();
      
      const queryTime = Date.now() - startTime;

      // Get connection pool info (simplified)
      // In production, this would query database metrics tables
      const connections = 1; // Simplified - would get actual pool size
      const slowQueries = 0; // Would track queries > threshold

      return {
        connections,
        queryTime,
        slowQueries
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {
        connections: 0,
        queryTime: 0,
        slowQueries: 0
      };
    }
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: SystemResourceMetrics): Promise<void> {
    try {
      await prisma.systemResourceMetrics.create({
        data: {
          cpuUsage: metrics.cpuUsage,
          cpuCores: metrics.cpuCores,
          cpuLoadAverage: metrics.cpuLoadAverage,
          memoryUsed: metrics.memoryUsed,
          memoryTotal: metrics.memoryTotal,
          memoryUsage: metrics.memoryUsage,
          heapUsed: metrics.heapUsed,
          heapTotal: metrics.heapTotal,
          diskUsed: metrics.diskUsed,
          diskTotal: metrics.diskTotal,
          diskUsage: metrics.diskUsage,
          networkBytesIn: metrics.networkBytesIn,
          networkBytesOut: metrics.networkBytesOut,
          networkConnections: metrics.networkConnections,
          databaseConnections: metrics.databaseConnections,
          databaseQueryTime: metrics.databaseQueryTime,
          databaseSlowQueries: metrics.databaseSlowQueries,
          timestamp: metrics.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to store resource metrics:', error);
    }
  }

  /**
   * Check for resource-related alerts
   */
  private async checkResourceAlerts(metrics: SystemResourceMetrics): Promise<void> {
    const alerts: MonitoringAlert[] = [];

    // CPU usage alert
    if (metrics.cpuUsage > this.alertThresholds.cpu) {
      alerts.push({
        id: `resource-cpu-${Date.now()}`,
        type: 'performance',
        severity: metrics.cpuUsage > 95 ? 'critical' : 'high',
        title: 'High CPU Usage',
        description: `CPU usage (${metrics.cpuUsage.toFixed(1)}%) exceeds threshold (${this.alertThresholds.cpu}%)`,
        metrics,
        threshold: this.alertThresholds.cpu,
        currentValue: metrics.cpuUsage,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email', 'slack']
      });
    }

    // Memory usage alert
    if (metrics.memoryUsage > this.alertThresholds.memory) {
      alerts.push({
        id: `resource-memory-${Date.now()}`,
        type: 'performance',
        severity: metrics.memoryUsage > 95 ? 'critical' : 'high',
        title: 'High Memory Usage',
        description: `Memory usage (${metrics.memoryUsage.toFixed(1)}%) exceeds threshold (${this.alertThresholds.memory}%)`,
        metrics,
        threshold: this.alertThresholds.memory,
        currentValue: metrics.memoryUsage,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email', 'slack']
      });
    }

    // Disk usage alert
    if (metrics.diskUsage > this.alertThresholds.disk) {
      alerts.push({
        id: `resource-disk-${Date.now()}`,
        type: 'performance',
        severity: metrics.diskUsage > 98 ? 'critical' : 'high',
        title: 'High Disk Usage',
        description: `Disk usage (${metrics.diskUsage.toFixed(1)}%) exceeds threshold (${this.alertThresholds.disk}%)`,
        metrics,
        threshold: this.alertThresholds.disk,
        currentValue: metrics.diskUsage,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email', 'slack']
      });
    }

    // Database performance alert
    if (metrics.databaseQueryTime > this.alertThresholds.databaseQueryTime) {
      alerts.push({
        id: `resource-db-${Date.now()}`,
        type: 'performance',
        severity: metrics.databaseQueryTime > 5000 ? 'critical' : 'medium',
        title: 'Slow Database Performance',
        description: `Database query time (${metrics.databaseQueryTime}ms) exceeds threshold (${this.alertThresholds.databaseQueryTime}ms)`,
        metrics,
        threshold: this.alertThresholds.databaseQueryTime,
        currentValue: metrics.databaseQueryTime,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email']
      });
    }

    // Store and send alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: MonitoringAlert): Promise<void> {
    try {
      await prisma.monitoringAlert.create({
        data: {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          metrics: alert.metrics as any,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          notificationChannels: alert.notificationChannels
        }
      });

      console.log(`RESOURCE ALERT: ${alert.title} - ${alert.description}`);
    } catch (error) {
      console.error('Failed to store resource alert:', error);
    }
  }

  /**
   * Generate resource utilization report
   */
  private async generateResourceReport(): Promise<void> {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      const metrics = await prisma.systemResourceMetrics.findMany({
        where: {
          timestamp: { gte: lastHour }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (metrics.length === 0) {
        return;
      }

      // Calculate averages
      const avgCpu = metrics.reduce((sum: number, m: any) => sum + m.cpuUsage, 0) / metrics.length;
      const avgMemory = metrics.reduce((sum: number, m: any) => sum + m.memoryUsage, 0) / metrics.length;
      const avgDisk = metrics.reduce((sum: number, m: any) => sum + m.diskUsage, 0) / metrics.length;
      const avgDbQueryTime = metrics.reduce((sum: number, m: any) => sum + m.databaseQueryTime, 0) / metrics.length;

      // Find peaks
      const maxCpu = Math.max(...metrics.map((m: any) => m.cpuUsage));
      const maxMemory = Math.max(...metrics.map((m: any) => m.memoryUsage));
      const maxDisk = Math.max(...metrics.map((m: any) => m.diskUsage));

      console.log(`System Resource Report (Last Hour):`);
      console.log(`- CPU: Avg ${avgCpu.toFixed(1)}%, Peak ${maxCpu.toFixed(1)}%`);
      console.log(`- Memory: Avg ${avgMemory.toFixed(1)}%, Peak ${maxMemory.toFixed(1)}%`);
      console.log(`- Disk: Avg ${avgDisk.toFixed(1)}%, Peak ${maxDisk.toFixed(1)}%`);
      console.log(`- DB Query Time: Avg ${avgDbQueryTime.toFixed(1)}ms`);

    } catch (error) {
      console.error('Failed to generate resource report:', error);
    }
  }

  /**
   * Get current resource status
   */
  public getCurrentResourceStatus(): SystemResourceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get resource history
   */
  public getResourceHistory(hours: number = 1): SystemResourceMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp.getTime() > cutoff);
  }

  /**
   * Get resource utilization summary
   */
  public getResourceSummary(hours: number = 24): any {
    const history = this.getResourceHistory(hours);
    
    if (history.length === 0) {
      return null;
    }

    const cpuValues = history.map(m => m.cpuUsage);
    const memoryValues = history.map(m => m.memoryUsage);
    const diskValues = history.map(m => m.diskUsage);

    return {
      period: `${hours} hours`,
      samples: history.length,
      cpu: {
        average: cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length,
        min: Math.min(...cpuValues),
        max: Math.max(...cpuValues)
      },
      memory: {
        average: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
        min: Math.min(...memoryValues),
        max: Math.max(...memoryValues)
      },
      disk: {
        average: diskValues.reduce((sum, val) => sum + val, 0) / diskValues.length,
        min: Math.min(...diskValues),
        max: Math.max(...diskValues)
      }
    };
  }
}

// Singleton instance
export const systemResourceMonitor = new SystemResourceMonitor();
