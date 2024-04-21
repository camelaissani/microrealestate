import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  Typography
} from '@material-ui/core';
import { Drawer, DrawerContent, DrawerHeader } from '../ui/drawer';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import BoxWithHover from '../../components/BoxWithHover';
import { Button } from '../ui/button';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getPeriod } from '../../utils';
import Loading from '../Loading';
import moment from 'moment';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import RentDetails from './RentDetails';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

function RentListItem({ rent, tenant, onClick }) {
  const { t } = useTranslation('common');

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick]
  );

  return (
    <BoxWithHover
      p={2}
      height="100%"
      border={1}
      borderColor="divider"
      withCursor
      onClick={handleClick}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box fontSize="h5.fontSize">
          {getPeriod(t, rent.term, tenant.occupant.frequency)}
        </Box>
        <IconButton onClick={handleClick}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box mt={1}>
        <RentDetails rent={rent} />
      </Box>
    </BoxWithHover>
  );
}

function YearRentList({ tenant, year, onClick }) {
  const rents =
    tenant.rents?.filter(({ term }) => String(term).slice(0, 4) === year) || [];

  const handleClick = useCallback(
    ({ occupant }, rent) =>
      () => {
        onClick({ _id: occupant._id, ...rent, occupant });
      },
    [onClick]
  );

  return (
    <Grid container spacing={2}>
      {rents?.map((rent) => {
        return (
          <Grid item key={rent.term} xs={12} sm={12} md={6} lg={4} xl={2}>
            <RentListItem
              key={rent.term}
              rent={rent}
              tenant={tenant}
              onClick={handleClick(tenant, rent)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}

function RentHistory({ tenantId }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState();
  const [rentYears, setRentYears] = useState([]);
  const [expandedYear, setExpandedYear] = useState(
    moment().startOf('month').format('YYYYMMDDHH').slice(0, 4)
  );
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchTenantRents = useCallback(
    async (showLoadingAnimation = true) => {
      showLoadingAnimation && setLoading(true);
      const response = await store.rent.fetchTenantRents(tenantId);
      if (response.status !== 200) {
        toast.error(t('Cannot get tenant information'));
      } else {
        const tenant = response.data;
        setTenant(tenant);
        setRentYears(
          Array.from(
            tenant.rents.reduce((acc, { term }) => {
              acc.add(String(term).slice(0, 4));
              return acc;
            }, new Set())
          )
        );
      }
      showLoadingAnimation && setLoading(false);
    },
    [store, t, tenantId]
  );

  useEffect(() => {
    fetchTenantRents();
  }, [t, tenantId, store.rent, store, fetchTenantRents]);

  const handleAccordionChange = (year) => (event, isExpanded) => {
    setExpandedYear(isExpanded ? year : false);
  };

  const handleClick = useCallback(
    (rent) => {
      setSelectedPayment(rent);
      setOpenNewPaymentDialog(true);
    },

    [setOpenNewPaymentDialog, setSelectedPayment]
  );

  const handleClose = useCallback(() => {
    fetchTenantRents(false);
  }, [fetchTenantRents]);

  return (
    <>
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
        data={selectedPayment}
        onClose={handleClose}
      />
      {loading ? (
        <Loading />
      ) : (
        <>
          <Box pb={4}>
            <Typography variant="h5">{tenant.occupant.name}</Typography>
            {tenant.occupant.beginDate && tenant.occupant.endDate && (
              <Typography color="textSecondary" variant="body2">
                {t('Contract from {{beginDate}} to {{endDate}}', {
                  beginDate: moment(
                    tenant.occupant.beginDate,
                    'DD/MM/YYYY'
                  ).format('L'),
                  endDate: moment(tenant.occupant.endDate, 'DD/MM/YYYY').format(
                    'L'
                  )
                })}
              </Typography>
            )}
          </Box>
          <div className="overflow-y-auto p-4">
            {rentYears.map((year) => {
              return (
                <Accordion
                  key={year}
                  expanded={expandedYear === year}
                  onChange={handleAccordionChange(year)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>{year}</Box>
                  </AccordionSummary>
                  {expandedYear === year ? (
                    <AccordionDetails>
                      <YearRentList
                        tenant={tenant}
                        year={year}
                        onClick={handleClick}
                      />
                    </AccordionDetails>
                  ) : null}
                </Accordion>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default function RentHistoryDialog({ open, setOpen, data: tenant }) {
  const { t } = useTranslation('common');
  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={false}>
      <DrawerContent className="w-full h-full p-4">
        <DrawerHeader className="flex justify-between p-0">
          <span className="text-xl font-semibold">{t('Rent schedule')}</span>
          <Button variant="secondary" onClick={handleClose}>
            {t('Close')}
          </Button>
        </DrawerHeader>
        {tenant ? <RentHistory tenantId={tenant._id} /> : null}
      </DrawerContent>
    </Drawer>
  );
}
