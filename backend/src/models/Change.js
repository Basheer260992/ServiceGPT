import mongoose from 'mongoose';

const changeSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true },
    description: String,
    priority: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], default: 'Moderate' },
    category: String,
    assignmentGroup: String,
    state: { type: String, enum: ['New', 'Assess', 'Approved', 'Implement', 'Review', 'Closed'], default: 'New' },
    impact: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    urgency: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    requestedBy: String,
    assignedTo: String,
    plannedStart: Date,
    plannedEnd: Date,
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
    attachments: [{ name: String, size: Number, dataUrl: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Change || mongoose.model('Change', changeSchema);
