import express from 'express';
import Family from '../models/Family.js';

const router = express.Router();

// GET /api/families - Get all families
router.get('/', async (req, res) => {
  try {
    const { rt, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (rt) query.rt = rt;
    if (search) {
      query.$or = [
        { namaKeluarga: { $regex: search, $options: 'i' } },
        { 'ahliKubur.namaAhliKubur': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const families = await Family.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Family.countDocuments(query);

    res.json({
      families,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching families:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data keluarga',
      message: error.message 
    });
  }
});

// GET /api/families/:id - Get single family
router.get('/:id', async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({ error: 'Data keluarga tidak ditemukan' });
    }
    res.json(family);
  } catch (error) {
    console.error('Error fetching family:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data keluarga',
      message: error.message 
    });
  }
});

// POST /api/families - Create new family
router.post('/', async (req, res) => {
  try {
    const { rt, namaKeluarga, ahliKubur } = req.body;

    // Validate required fields
    if (!rt || !namaKeluarga || !ahliKubur || ahliKubur.length === 0) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'RT, nama keluarga, dan minimal satu ahli kubur harus diisi'
      });
    }

    // Filter out empty entries
    const validAhliKubur = ahliKubur.filter(ahli => 
      ahli.namaAhliKubur && ahli.binBinti && ahli.namaOrangTua
    );

    if (validAhliKubur.length === 0) {
      return res.status(400).json({ 
        error: 'Data ahli kubur tidak valid',
        message: 'Minimal satu data ahli kubur yang lengkap harus diisi'
      });
    }

    const family = new Family({
      rt,
      namaKeluarga: namaKeluarga.trim(),
      ahliKubur: validAhliKubur
    });

    const savedFamily = await family.save();
    res.status(201).json({
      message: 'Data keluarga berhasil disimpan',
      family: savedFamily
    });
  } catch (error) {
    console.error('Error creating family:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Data tidak valid',
        message: errors.join(', ')
      });
    }
    res.status(500).json({ 
      error: 'Gagal menyimpan data keluarga',
      message: error.message 
    });
  }
});

// PUT /api/families/:id - Update family
router.put('/:id', async (req, res) => {
  try {
    const { rt, namaKeluarga, ahliKubur } = req.body;

    // Validate required fields
    if (!rt || !namaKeluarga || !ahliKubur || ahliKubur.length === 0) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'RT, nama keluarga, dan minimal satu ahli kubur harus diisi'
      });
    }

    // Filter out empty entries
    const validAhliKubur = ahliKubur.filter(ahli => 
      ahli.namaAhliKubur && ahli.binBinti && ahli.namaOrangTua
    );

    if (validAhliKubur.length === 0) {
      return res.status(400).json({ 
        error: 'Data ahli kubur tidak valid',
        message: 'Minimal satu data ahli kubur yang lengkap harus diisi'
      });
    }

    const updatedFamily = await Family.findByIdAndUpdate(
      req.params.id,
      {
        rt,
        namaKeluarga: namaKeluarga.trim(),
        ahliKubur: validAhliKubur
      },
      { new: true, runValidators: true }
    );

    if (!updatedFamily) {
      return res.status(404).json({ error: 'Data keluarga tidak ditemukan' });
    }

    res.json({
      message: 'Data keluarga berhasil diperbarui',
      family: updatedFamily
    });
  } catch (error) {
    console.error('Error updating family:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Data tidak valid',
        message: errors.join(', ')
      });
    }
    res.status(500).json({ 
      error: 'Gagal memperbarui data keluarga',
      message: error.message 
    });
  }
});

// DELETE /api/families/:id - Delete family
router.delete('/:id', async (req, res) => {
  try {
    const deletedFamily = await Family.findByIdAndDelete(req.params.id);
    
    if (!deletedFamily) {
      return res.status(404).json({ error: 'Data keluarga tidak ditemukan' });
    }

    res.json({
      message: 'Data keluarga berhasil dihapus',
      family: deletedFamily
    });
  } catch (error) {
    console.error('Error deleting family:', error);
    res.status(500).json({ 
      error: 'Gagal menghapus data keluarga',
      message: error.message 
    });
  }
});

export default router;