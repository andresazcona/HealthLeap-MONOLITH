import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';

export function Confirmar({ abierto, titulo, texto, confirmar, peligro, cargando, onConfirmar, onCerrar }: {
  abierto: boolean;
  titulo: string;
  texto: ReactNode;
  confirmar: string;
  peligro?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{texto}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onCerrar}>Volver</Button>
        <Button variant="contained" color={peligro ? 'error' : 'primary'} onClick={onConfirmar} disabled={cargando}>
          {confirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
