// pages/TripPlannerForm.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
  Paper,
} from '@mui/material';

const TripPlannerForm: React.FC = () => {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    flexibleDates: false,
    travelers: 1,
    budget: '',
    lodging: '',
    flightPreferences: '',
    airline: '',
    cabinClass: '',
    needCar: false,
    carType: '',
    foodPreferences: '',
    dietaryRestrictions: '',
    experiences: '',
    mustAvoid: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', form);
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ borderRadius: 4, p: 6, background: '#f9f9f9' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
          ✈️ Plan Your Dream Trip
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField label="Traveling From" name="origin" value={form.origin} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Destination" name="destination" value={form.destination} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Departure Date" type="date" name="departureDate" value={form.departureDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Return Date" type="date" name="returnDate" value={form.returnDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.flexibleDates} onChange={handleCheckbox} name="flexibleDates" />} label="My dates are flexible" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Number of Travelers" type="number" name="travelers" value={form.travelers} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Total Budget (USD)" name="budget" value={form.budget} onChange={handleChange} fullWidth />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Preferred Airlines" name="airline" value={form.airline} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Cabin Class (economy, business, etc)" name="cabinClass" value={form.cabinClass} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Flight Preferences (layovers, times, etc)" name="flightPreferences" value={form.flightPreferences} onChange={handleChange} fullWidth />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Lodging Preferences (hotel, Airbnb, etc)" name="lodging" value={form.lodging} onChange={handleChange} fullWidth />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.needCar} onChange={handleCheckbox} name="needCar" />} label="I’ll need a rental car" />
            </Grid>
            {form.needCar && (
              <Grid item xs={12}>
                <TextField label="Preferred Car Type" name="carType" value={form.carType} onChange={handleChange} fullWidth />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField label="Food Preferences (types of restaurants, etc)" name="foodPreferences" value={form.foodPreferences} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Dietary Restrictions" name="dietaryRestrictions" value={form.dietaryRestrictions} onChange={handleChange} fullWidth />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Desired Experiences (activities, themes)" name="experiences" value={form.experiences} onChange={handleChange} fullWidth multiline rows={3} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Must Avoid (noise, long drives, etc)" name="mustAvoid" value={form.mustAvoid} onChange={handleChange} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button variant="contained" color="primary" size="large" type="submit" sx={{ px: 6, py: 1.5, fontWeight: 'bold', fontSize: '1rem', borderRadius: '999px' }}>
              ✨ Submit Trip Plan
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TripPlannerForm;