/**
 * Chart.js Mock for Local Development
 * This provides a basic Chart.js-like interface for testing when CDN is blocked
 */

window.Chart = class MockChart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.canvas = ctx.canvas;
        
        console.log('📊 Mock Chart created:', config.type, config);
        
        // Draw a simple mock chart
        this.drawMockChart();
    }
    
    drawMockChart() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas size if not set
        if (canvas.width === 0) {
            canvas.width = 400;
            canvas.height = 300;
        }
        
        // Draw mock chart based on type
        switch (this.config.type) {
            case 'doughnut':
                this.drawMockDoughnut(ctx);
                break;
            case 'bar':
                this.drawMockBar(ctx);
                break;
            case 'line':
                this.drawMockLine(ctx);
                break;
            default:
                this.drawMockGeneric(ctx);
        }
        
        // Draw title if present
        if (this.config.options?.plugins?.title?.display) {
            this.drawTitle(ctx, this.config.options.plugins.title.text);
        }
    }
    
    drawMockDoughnut(ctx) {
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const outerRadius = Math.min(centerX, centerY) - 20;
        const innerRadius = outerRadius * 0.5;
        
        const data = this.config.data.datasets[0].data;
        const total = data.reduce((sum, val) => sum + val, 0);
        const colors = this.config.data.datasets[0].backgroundColor || ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'];
        
        let currentAngle = 0;
        
        data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
        
        // Draw legend
        this.drawLegend(ctx, this.config.data.labels, colors);
    }
    
    drawMockBar(ctx) {
        const canvas = ctx.canvas;
        const margin = 40;
        const data = this.config.data.datasets[0].data;
        const labels = this.config.data.labels;
        const maxValue = Math.max(...data);
        
        const barWidth = (canvas.width - 2 * margin) / data.length;
        const chartHeight = canvas.height - 2 * margin;
        
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = margin + index * barWidth;
            const y = canvas.height - margin - barHeight;
            
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
            
            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index] || index, x + barWidth/2, canvas.height - 10);
            
            // Draw value
            ctx.fillText(value, x + barWidth/2, y - 5);
        });
    }
    
    drawMockLine(ctx) {
        const canvas = ctx.canvas;
        const margin = 40;
        const data = this.config.data.datasets[0].data;
        const maxValue = Math.max(...data);
        
        const stepX = (canvas.width - 2 * margin) / (data.length - 1);
        const chartHeight = canvas.height - 2 * margin;
        
        ctx.beginPath();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        
        data.forEach((value, index) => {
            const x = margin + index * stepX;
            const y = canvas.height - margin - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw point
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
        });
        
        ctx.stroke();
    }
    
    drawMockGeneric(ctx) {
        const canvas = ctx.canvas;
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mock Chart', canvas.width/2, canvas.height/2);
        ctx.fillText(`Type: ${this.config.type}`, canvas.width/2, canvas.height/2 + 30);
    }
    
    drawTitle(ctx, title) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, ctx.canvas.width/2, 25);
    }
    
    drawLegend(ctx, labels, colors) {
        const startX = 10;
        const startY = 10;
        const itemHeight = 20;
        
        labels.forEach((label, index) => {
            const y = startY + index * itemHeight;
            
            // Draw color box
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(startX, y, 15, 15);
            
            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(label, startX + 20, y + 12);
        });
    }
    
    destroy() {
        console.log('📊 Mock Chart destroyed');
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    update() {
        console.log('📊 Mock Chart updated');
        this.drawMockChart();
    }
};

console.log('📊 Mock Chart.js loaded successfully');