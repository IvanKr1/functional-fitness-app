import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

const Layout = () => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Fitness Scheduler
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Outlet />
      </Container>
    </>
  );
};

export default Layout; 