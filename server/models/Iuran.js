import mongoose from 'mongoose';

const iuranSchema = new mongoose.Schema({
  rt: {
    type: String,
    required: [true, 'RT harus dipilih'],
    enum: ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06']
  },
  nominal: {
    type: Number,
    required: [true, 'Nominal iuran harus diisi'],
    min: [1, 'Nominal harus lebih dari 0']
  },
  tanggal: {
    type: Date,
    required: [true, 'Tanggal pembayaran harus diisi']
  },
  keterangan: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
iuranSchema.index({ rt: 1 });
iuranSchema.index({ tanggal: -1 });
iuranSchema.index({ rt: 1, tanggal: -1 });

// Virtual for formatted nominal
iuranSchema.virtual('nominalFormatted').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(this.nominal);
});

export default mongoose.model('Iuran', iuranSchema);