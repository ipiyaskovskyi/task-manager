'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Stack } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth/token-storage';

export const Header: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Task Management
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="small"
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
