import * as React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Button, Stack } from '@mui/material'

const columns = [
  { field: 'id', headerName: 'ID', width: 220 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'model', headerName: 'Model', flex: 1 },
]

export default function CrudTable({ rows = [], onCreate }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button variant="contained" onClick={onCreate}>Create</Button>
      </Stack>
      <div style={{ height: 480, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick />
      </div>
    </Box>
  )
}


