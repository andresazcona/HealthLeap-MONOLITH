import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function Encabezado({ titulo, subtitulo, acciones, antetitulo }: {
  titulo: string;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
  antetitulo?: string;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }} justifyContent="space-between" sx={{ mb: 3 }}>
      <Box>
        {antetitulo && <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 0.5 }}>{antetitulo}</Typography>}
        <Typography variant="h1" sx={{ fontSize: { xs: 26, sm: 32 } }}>{titulo}</Typography>
        {subtitulo && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitulo}</Typography>}
      </Box>
      {acciones && <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{acciones}</Stack>}
    </Stack>
  );
}
