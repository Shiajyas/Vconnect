exports.getExcelFiles = async (req, res) => {
    try {
        console.log('Fetching excel files...');
        const excelFiles = await ExcelData.find().select('excelName isPrimary uploadedAt');
        console.log('Excel files fetched:', excelFiles);
        
        return res.json(excelFiles); 
    } catch (error) {
        console.error('Error fetching excel files:', error);

        if (!res.headersSent) { 
            return res.status(500).json({ 
                error: 'Failed to fetch excel files', 
                details: error.message 
            });
        } 
    }
};