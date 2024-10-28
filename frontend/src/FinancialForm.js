// frontend/src/FinancialForm.js

import React from 'react';
import { Box, Typography, Slider, Button } from '@mui/material';
import PropTypes from 'prop-types';

const FinancialForm = ({ financialForm, setFinancialForm, onSubmit }) => {
  const handleSliderChange = (field) => (event, newValue) => {
    setFinancialForm({
      ...financialForm,
      [field]: newValue,
    });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ textAlign: 'center' }}
      >
        Financial Planning Details
      </Typography>

      <Typography gutterBottom>Initial Investment: ${financialForm.initialInvestment}</Typography>
      <Slider
        value={financialForm.initialInvestment}
        min={0}
        max={10000}
        step={100}
        onChange={handleSliderChange('initialInvestment')}
        valueLabelDisplay="auto"
      />

      <Typography gutterBottom>Monthly Investment: ${financialForm.periodicInvestment}</Typography>
      <Slider
        value={financialForm.periodicInvestment}
        min={0}
        max={5000}
        step={50}
        onChange={handleSliderChange('periodicInvestment')}
        valueLabelDisplay="auto"
      />

      <Typography gutterBottom>Desired Final Value: ${financialForm.finalValue}</Typography>
      <Slider
        value={financialForm.finalValue}
        min={0}
        max={50000}
        step={500}
        onChange={handleSliderChange('finalValue')}
        valueLabelDisplay="auto"
      />

      <Typography gutterBottom>Number of Months: {financialForm.numberOfPeriods}</Typography>
      <Slider
        value={financialForm.numberOfPeriods}
        min={1}
        max={30}
        step={1}
        onChange={handleSliderChange('numberOfPeriods')}
        valueLabelDisplay="auto"
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          sx={{
            textTransform: 'none', // Removes all caps transformation
            paddingX: 4,
          }}
        >
          Calculate Required Interest Rate
        </Button>
      </Box>
    </Box>
  );
};

FinancialForm.propTypes = {
  financialForm: PropTypes.object.isRequired,
  setFinancialForm: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default FinancialForm;
