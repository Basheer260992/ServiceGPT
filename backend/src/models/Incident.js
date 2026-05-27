import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true },
    description: String,
    priority: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], default: 'Moderate' },
    category: String,
    assignmentGroup: String,
    state: { type: String, enum: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'], default: 'New' },
    impact: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    urgency: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    requestedBy: String,
    assignedTo: String,
    attachments: [{ name: String, size: Number, dataUrl: String }],
    sla: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
