/* Crunch Fitness equipment library — generated from Richmond's 2026-09-22 photo audit.
   Machine identities are label-backed where possible. Indoor GPS is venue-level only:
   median photo horizontal error ~22.6 m, so zone placement uses EXIF time/direction +
   consecutive-photo context and is intentionally schematic/not to scale. */
(function () {
  'use strict';

  var PHOTO_IDS = {
  "IMG_2079.JPG": "1dvo4TKWDNdwqmuMRMAUPPX1dv3dJDgvZ",
  "IMG_2080.JPG": "16OfNvUk-NhORot_oAXN128YtWpNaXoNh",
  "IMG_2196.JPG": "1tjxPGqsu3sWURG4_b8Wuh0SyqcNMI4CT",
  "IMG_2197.JPG": "1GrTMGPUFRaYmoghiZ8vV6ZldejhHZwA1",
  "IMG_2212.JPG": "1OrJdz5NhJaw3l_BxGs6fK1QqVcQh8eQc",
  "IMG_2213.JPG": "1wrKOKU4LtXWYukVK8dBhPtrT70vDXVKe",
  "IMG_2081.JPG": "1_TXXsfJojArAEKSWEMS6WPKCMnpYi0I3",
  "IMG_2082.JPG": "1O0RGAumUFfJ0JASJ5T4ldLcbDKAPtGOh",
  "IMG_2210.JPG": "1tfpHSBSv5pQHmV56ubxrxdxx_dMb6dpN",
  "IMG_2211.JPG": "1yiHM9GKqbDjUAs6469TT3oabSO_U1siF",
  "IMG_2083.JPG": "1PZVkHPvbCXHHSBVzNv59X2lnyIaWbcsL",
  "IMG_2084.JPG": "13L__eE4YPKWZ3oAkcN13RenJ5aH-I6-X",
  "IMG_2208.JPG": "1gMMgM4n_JGQFSnxP2wKPdUwUBmunw331",
  "IMG_2209.JPG": "1YUfAWiyu76qT_csViira0c5tni59FNin",
  "IMG_2085.JPG": "1iVvvHvDwgY_vzwzc_VlZdO670Z9ZY8GB",
  "IMG_2086.JPG": "1ryDhST2RYzy59-7q8L2n9ZYFSgjTh2la",
  "IMG_2204.JPG": "1fto6SsGd2FqlQSyyFuWW32c8B07noybu",
  "IMG_2205.JPG": "1pr9PKzdgKGs59tY98S6xY_AAZB8QyAub",
  "IMG_2087.JPG": "1xxkp21uUu-FMhPH1j9H1mXxowX7XRlB0",
  "IMG_2088.JPG": "1q9hd5B31k_xy5Yod4pLcoyUQeJE7VgN_",
  "IMG_2206.JPG": "1gDAuEEFjyk8FlMYjjjVkh05slM3lP1Er",
  "IMG_2207.JPG": "17o88iprPPga66wLS1PI4j9A84-4_EHjw",
  "IMG_2089.JPG": "1sH0pWA8q-tquVFBWbUSDZ_zF7VkTgUi2",
  "IMG_2090.JPG": "1yqDkmlHEMyzDD1_zwMzrmM5ZhlayPyTb",
  "IMG_2202.JPG": "1wU_thtjmZofFIhMJMPhhQ95uKKRzP2gU",
  "IMG_2203.JPG": "1Rf7oHJM2S6jGkHfs7xOABSCGgH23ZbR8",
  "IMG_2091.JPG": "1DNvCU8JOYBYwpbk11ffCGYRINz8kSumN",
  "IMG_2092.JPG": "1pmKtgs8re7Phb2Gc5m9jy4A2D3n0qV5b",
  "IMG_2093.JPG": "1SM3Hvz3M7-sFiEn9gS4_32MmZ0bi4WhK",
  "IMG_2094.JPG": "1XSDU5z_JUOGU0qVEfCBCL9UgGt1QH_Lh",
  "IMG_2095.JPG": "1PkUywarA1AIQlghMTVYtc3yAGXdI27bc",
  "IMG_2096.JPG": "1nbDCbSER-Yuopd0YjPsMn7BcsI2SgrYV",
  "IMG_2097.JPG": "18vIO26hjnnBuhoQavOXYet4LqY0kaSVM",
  "IMG_2098.JPG": "10GfNK8t2QgEuRPe75OaJEfod-5k97E7b",
  "IMG_2099.JPG": "1z9W9z-WQOFUtx7YgfHECPXSgIJL4wQOp",
  "IMG_2100.JPG": "19WfnKZCauTcvNqgs6TqG8FGipADb5FQp",
  "IMG_2101.JPG": "1Zwz55SIzmjpKUGNaS2IT0h7BryW7ZRt_",
  "IMG_2102.JPG": "1a_i3vyN-6gIWdL42MHTt_rZsBh7QUIBD",
  "IMG_2103.JPG": "1QMT-uZXBnY9td9ULQ5P5CAStG_FlQT2v",
  "IMG_2104.JPG": "1WiDt7wQKysPj5sxv4yfh05Oi9Xq54dUp",
  "IMG_2105.JPG": "1J7rn4D62VjgtR5YDUzV9BasvCsdFmvu-",
  "IMG_2106.JPG": "1adw20Dt4v7cJQPTeU1VTSHsNZGHv2RVd",
  "IMG_2107.JPG": "1u-D5Q6dIwwrSvjLDwKR0xN3lS-z8j7KA",
  "IMG_2108.JPG": "17tsXeX-_3sgTWDhOf0NiPAnjkIbXhs_E",
  "IMG_2109.JPG": "1QtBip8pV75EgBtEGyG8SaZMxlQSheXEl",
  "IMG_2110.JPG": "1Og1ytpVWxP_1fQd-2-6W_2ytxI1Yp3Ex",
  "IMG_2111.JPG": "1bT64XrcqgxcjxRSLT5QdW2oMdQpGfRBv",
  "IMG_2112.JPG": "1LvwYaybKL79lilppjl744rDm0kAd-Qis",
  "IMG_2113.JPG": "14MMfdyPxs8rBBAjF5O1An3XMCp5Gn4JE",
  "IMG_2114.JPG": "1Bom8-VkbqgExczfs_-oy_oXojwmCt0ob",
  "IMG_2115.JPG": "1ODvzDhKqWRFBZC_Ooh4ynsOkgXaLy-C_",
  "IMG_2116.JPG": "1BXs0igjDW1iQsSD8xlDKIXsA6UcDmDDz",
  "IMG_2117.JPG": "1vEA5eJEhZSSTfdFhGvhe9cyf6uxN9f-T",
  "IMG_2118.JPG": "16akHv9CxcbneU7niTempG_QlokWZSJm2",
  "IMG_2119.JPG": "180yuNCnPLCm97Ohnu_51NgKazk4_I2tx",
  "IMG_2120.JPG": "1btO89pYxA2tybMveWqSGRPVdT3s1YMl3",
  "IMG_2121.JPG": "1Cl7H2Wrobg2NrvmVX-wVMYRhyB7QNcBE",
  "IMG_2122.JPG": "1Zfl7v3G5IsgLCC2gv3LNIjmWGfI4D9MZ",
  "IMG_2123.JPG": "1SWYcDl7nPfkFBfPFQeWJDy4lcUw29YT6",
  "IMG_2124.JPG": "1szD6iwYZnhXYfKY4KMfaVY6PxRwbfXXF",
  "IMG_2125.JPG": "1c8DwmVgrlLqA1RHiZuAOGrBeGRhng_i1",
  "IMG_2126.JPG": "1xBIr-L-rtcjWh-xaTZ3laQiwo9N63gM_",
  "IMG_2127.JPG": "1XoWOj1xMq_RlhT_59q6KSM4zJ1U7DzFK",
  "IMG_2128.JPG": "1O9wMRNCZyxgVcZMacHEHolBFFHD0559t",
  "IMG_2129.JPG": "1yLwE0SanuasK4NsaAA0NkUP0UhAIs1PW",
  "IMG_2130.JPG": "1FmeFkrJKOM6DmLr0mJGz2B2gA8r5Og97",
  "IMG_2131.JPG": "1civCmqAPU-7dlgDV0W1dVHc8TIuTYMdn",
  "IMG_2132.JPG": "1fzKUyobQTfDZr0oz4-OG3NS26_-9D1We",
  "IMG_2142.JPG": "1e5TGfNLG8Bg734fWtH1T7RJdTpJa7d2S",
  "IMG_2143.JPG": "1JHR25TYzuBfcNpSwrQuZzzEIhwxwy9y2",
  "IMG_2144.JPG": "1Ir-x38H32DFFHa9f0OZ0xo-N6Ma292k9",
  "IMG_2145.JPG": "1n-Gprn4NB22XgystIzzBMaXrbFygo0bM",
  "IMG_2146.JPG": "1VgMvtvBSUg-zqm2n2ATYtANC9BXB6CLN",
  "IMG_2147.JPG": "1FYK0E9kCm1Z5BjbGhIlEPISrKUivpg9-",
  "IMG_2148.JPG": "1azgonqcNOtseSVg7SV0_aOEjlQ7IB15t",
  "IMG_2149.JPG": "1Q8-_b-qoo_0l1kg2g0WtwU9XlKgW0wWm",
  "IMG_2150.JPG": "1IQHfmk8iwGjYCicGp4mpAzc_FVWsbXWE",
  "IMG_2151.JPG": "1I46RtTvGjSK5BkoQcGHqwID3sMgW-9bu",
  "IMG_2152.JPG": "1Xg-vKnPiAdJibLFThi3w9z3AttKYaRt3",
  "IMG_2153.JPG": "10D_Igzmobwi4r2-8b7ppuE7p16mJP14D",
  "IMG_2154.JPG": "11mB4a62ppzNwHc_9TpnMgr9EBANXvmf-",
  "IMG_2155.JPG": "17kUpOgVGiOlh_yQoFx4bgj119OHsl5vd",
  "IMG_2156.JPG": "1iYzeIEtT_ZXV4qpTt68jgm--2rM4JXuA",
  "IMG_2157.JPG": "1hBejejji3-Pvjldlvnfn_VYMX127-3sR",
  "IMG_2158.JPG": "1zqi3_D4reeBYYEsBkSxF52JhnFEo60lk",
  "IMG_2159.JPG": "1ZyOJmd_W0QDbrEhAwjVq4AS1ppnRaJVr",
  "IMG_2160.JPG": "17Z8zF9DZCXmEAWHdsP417q8GBuRNtlaP",
  "IMG_2161.JPG": "1iSpCLMmTDUA8k2MfGXfOwyZj9PAVt-WZ",
  "IMG_2162.JPG": "1DXRvY0SHVZMjFy9MjscK1RIGiSYPFeXb",
  "IMG_2163.JPG": "1S69lRtGzMwQcz-iTNwVrhVPKaAYSKsXu",
  "IMG_2164.JPG": "1xPjtZ72diIPXqVaqkae0jhQhPrCsrQ97",
  "IMG_2165.JPG": "1Bc74FimgWVoUic-j1WlG3MAgFEomrYzb",
  "IMG_2166.JPG": "18f0wfD2CBoLfm4NOd2L80afMGWx3LKST",
  "IMG_2167.JPG": "1njoiAAcDqgWYRrTYyo0xUCOlQSiekvG6",
  "IMG_2168.JPG": "16novwS2y2nU7JlnxKEVB07JeUtOFBf05",
  "IMG_2169.JPG": "17NgsyjZdi_GjDYFFRC4-GajMRYyZU3PX",
  "IMG_2170.JPG": "1Ps_vrUZX8BlCdYeFrlNUH8bVbdEfLJTc",
  "IMG_2171.JPG": "1j4PrJOkIlwAr_ZoQUBswkKiQrYRNQset",
  "IMG_2172.JPG": "1FcCWlnk7-E1a4f1cf0EIw64ugtW1rIM8",
  "IMG_2173.JPG": "1M0puw0DxD2Arg18VpANgXnHLQ4JymOVr",
  "IMG_2174.JPG": "1A2s7wMauKzt2WPKTxukZ1q5w5BplXkHY",
  "IMG_2175.JPG": "1aUpbfALQSQ8RuyHHCe9_k3pmiGEoc1kb",
  "IMG_2176.JPG": "1c256P4qMAfTHpupl_Sajqlvs61MQIqGT",
  "IMG_2177.JPG": "19pNpjcRwWWGNjWhXxJjvhPDYBdHEamQz",
  "IMG_2178.JPG": "1M1k56UkUGVLBOOhpPFTChmCgPM7wAImH",
  "IMG_2179.JPG": "1QXQLY9kCBuxLGtpcMplns1I7-GHBz9X8",
  "IMG_2180.JPG": "1hMwHm_cLxv76yw8liIIGnotCmdkqCsOP",
  "IMG_2181.JPG": "170wlaMSRSrThpQX8Q4mKrnvqRj881AcV",
  "IMG_2182.JPG": "1kOsZoMZ9PV5PwuJKXl1Den_0Rm84f8lY",
  "IMG_2183.JPG": "1QR37RXdQmf5tqClqx1mLZVFXiw66NBX5",
  "IMG_2184.JPG": "1wIsJCT0iPWi0aB9EnD3NPB8_gw6jSbGL",
  "IMG_2185.JPG": "1DPDIRpD_Wcw-aStHyCewFXQn8D6nZ1NO",
  "IMG_2186.JPG": "1keJZIOYpOsG7bTc6JoLjwavLuux40ZGY",
  "IMG_2187.JPG": "1dg4lEcgQTGgnxbedLR1R-ovxqVk3xa0_",
  "IMG_2188.JPG": "1F65ub5isVNDsqt62aE_IiYXuIqhX8AAI",
  "IMG_2189.JPG": "1DPEvTODazWqb1OhcWradtDAaXTDNG948",
  "IMG_2190.JPG": "1qXm0jaDJZ8_E737rt0mMuv3ip_coRlTr",
  "IMG_2191.JPG": "1aY-OKarudflr3Kw_dg8dwwUgrywl2lkM",
  "IMG_2192.JPG": "1s7jH5R-ZM9uENf7188we5uXuwxKcbAbC",
  "IMG_2193.JPG": "10evNrOk1EHCazLMLj3LSf_-jmeVu6Dva",
  "IMG_2194.JPG": "1cMiMlyUTz-0pWIi6mklPsYUK-fGFkPGW",
  "IMG_2195.JPG": "1Yqo2l-hVZOWxUIARgqmvyuvvFkm5gmOR",
  "IMG_2198.JPG": "1YPNsxUbUNEtHnpyOFzxXNZ59DhLjvyFc",
  "IMG_2199.JPG": "1OV_9j1gLn2k3mj_RnfP1eCcaHtd-otrQ",
  "IMG_2200.JPG": "1CBLnirvZrTOPV-nX2tyNEm3I21Q9eSkg",
  "IMG_2201.JPG": "1fw87gQljXtEf8bCbfprGV-eZuZ__J1O3",
  "IMG_2214.JPG": "1df0fqU6uNFrKiBIDWUvtgroMTCfuBw8x",
  "IMG_2215.JPG": "1UfoxrEqdpEjw59Im4IV2XQlwmYrUkW9v",
  "IMG_2216.JPG": "1XxrEim-oNrmYgQ-BHtXjQk3LRSy3LXYv",
  "IMG_2217.JPG": "1JiHHBh08f5BPdUzVQxeFN3aRD9jaXqT_",
  "IMG_2218.JPG": "1Y9BFvgvaz0BpQmHNk-cE6AlgtAkT8FTn"
};
  var RAW = [
  {
    "id": "cr-hs-chest-press",
    "name": "Hammer Strength Chest Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Horizontal press",
    "primary": "Chest",
    "secondary": "Triceps, front deltoids",
    "ex": [
      "sel_chest_press"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2079.JPG",
      "IMG_2080.JPG",
      "IMG_2196.JPG",
      "IMG_2197.JPG",
      "IMG_2212.JPG",
      "IMG_2213.JPG"
    ],
    "label": "IMG_2080.JPG",
    "evidence": "The equipment plaque explicitly reads CHEST PRESS. Later photographs show the same Hammer Strength chest-press model again; this is one model-level guide, not a machine-count claim."
  },
  {
    "id": "cr-hoist-oblique-crunch",
    "name": "Hoist ROC-IT Abdominal / Oblique Crunch",
    "cat": "Core",
    "template": "coreCrunch",
    "style": "core",
    "pattern": "Trunk flexion / rotation",
    "primary": "Abdominals and obliques",
    "secondary": "Deep trunk stabilizers",
    "ex": [
      "ab_crunch_machine"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2081.JPG",
      "IMG_2082.JPG",
      "IMG_2210.JPG",
      "IMG_2211.JPG"
    ],
    "label": "IMG_2082.JPG",
    "evidence": "The Hoist instruction plaque lists oblique crunch, twisting oblique, rotating crunch, torso rotation, and the swiveling-seat setup."
  },
  {
    "id": "cr-hoist-seated-dip",
    "name": "Hoist ROC-IT Seated Dip",
    "cat": "Push",
    "template": "dip",
    "style": "compound",
    "pattern": "Seated dip / elbow extension",
    "primary": "Triceps",
    "secondary": "Chest and front deltoids",
    "ex": [],
    "zone": "rocit",
    "photos": [
      "IMG_2083.JPG",
      "IMG_2084.JPG",
      "IMG_2208.JPG",
      "IMG_2209.JPG"
    ],
    "label": "IMG_2084.JPG",
    "evidence": "The machine plaque explicitly reads SEATED DIP."
  },
  {
    "id": "cr-hoist-shoulder-press",
    "name": "Hoist ROC-IT Shoulder Press",
    "cat": "Push",
    "template": "shoulderPress",
    "style": "compound",
    "pattern": "Vertical press",
    "primary": "Deltoids",
    "secondary": "Triceps and upper chest",
    "ex": [
      "sel_shoulder_press"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2085.JPG",
      "IMG_2086.JPG",
      "IMG_2204.JPG",
      "IMG_2205.JPG"
    ],
    "label": "IMG_2086.JPG",
    "evidence": "The machine plaque explicitly reads SHOULDER PRESS."
  },
  {
    "id": "cr-hoist-pec-fly",
    "name": "Hoist ROC-IT Pec Fly",
    "cat": "Push",
    "template": "fly",
    "style": "isolation",
    "pattern": "Horizontal shoulder adduction",
    "primary": "Chest",
    "secondary": "Front deltoids",
    "ex": [
      "pec_deck"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2087.JPG",
      "IMG_2088.JPG",
      "IMG_2206.JPG",
      "IMG_2207.JPG"
    ],
    "label": "IMG_2088.JPG",
    "evidence": "The machine plaque explicitly reads PEC FLY."
  },
  {
    "id": "cr-hoist-chest-press",
    "name": "Hoist ROC-IT Chest Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Horizontal press",
    "primary": "Chest",
    "secondary": "Triceps and front deltoids",
    "ex": [
      "sel_chest_press"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2089.JPG",
      "IMG_2090.JPG",
      "IMG_2202.JPG",
      "IMG_2203.JPG"
    ],
    "label": "IMG_2090.JPG",
    "evidence": "The machine plaque explicitly reads CHEST PRESS."
  },
  {
    "id": "cr-hoist-mid-row",
    "name": "Hoist ROC-IT Mid Row",
    "cat": "Pull",
    "template": "row",
    "style": "compound",
    "pattern": "Horizontal pull",
    "primary": "Mid-back and lats",
    "secondary": "Rear deltoids and biceps",
    "ex": [
      "sel_seated_row"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2091.JPG",
      "IMG_2092.JPG"
    ],
    "label": "IMG_2092.JPG",
    "evidence": "The machine plaque explicitly reads MID ROW."
  },
  {
    "id": "cr-hoist-lat-pulldown",
    "name": "Hoist ROC-IT Lat Pulldown",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Vertical pull",
    "primary": "Lats",
    "secondary": "Biceps and upper back",
    "ex": [
      "lat_pulldown"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2093.JPG",
      "IMG_2094.JPG"
    ],
    "label": "IMG_2094.JPG",
    "evidence": "The machine plaque explicitly reads LAT PULLDOWN."
  },
  {
    "id": "cr-hoist-glute-master",
    "name": "Hoist ROC-IT Glute Master",
    "cat": "Legs",
    "template": "glutePress",
    "style": "isolation",
    "pattern": "Hip extension",
    "primary": "Glutes",
    "secondary": "Hamstrings",
    "ex": [],
    "zone": "rocit",
    "photos": [
      "IMG_2095.JPG",
      "IMG_2096.JPG"
    ],
    "label": "IMG_2096.JPG",
    "evidence": "The machine plaque explicitly reads GLUTE MASTER. It remains guide-only because the current exercise library has no exact load-matched Glute Master exercise."
  },
  {
    "id": "cr-hoist-leg-extension",
    "name": "Hoist ROC-IT Leg Extension",
    "cat": "Legs",
    "template": "legExtension",
    "style": "isolation",
    "pattern": "Knee extension",
    "primary": "Quadriceps",
    "secondary": "None significant",
    "ex": [
      "leg_extension"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2097.JPG",
      "IMG_2098.JPG"
    ],
    "label": "IMG_2098.JPG",
    "evidence": "The machine plaque explicitly reads LEG EXTENSION."
  },
  {
    "id": "cr-hoist-leg-curl",
    "name": "Hoist ROC-IT Leg Curl",
    "cat": "Legs",
    "template": "legCurl",
    "style": "isolation",
    "pattern": "Knee flexion",
    "primary": "Hamstrings",
    "secondary": "Calves",
    "ex": [
      "seated_leg_curl"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2099.JPG",
      "IMG_2100.JPG"
    ],
    "label": "IMG_2100.JPG",
    "evidence": "The machine plaque explicitly reads LEG CURL and the photographed setup is seated."
  },
  {
    "id": "cr-hoist-leg-press",
    "name": "Hoist ROC-IT Leg Press",
    "cat": "Legs",
    "template": "legPress",
    "style": "compound",
    "pattern": "Knee and hip extension",
    "primary": "Quadriceps and glutes",
    "secondary": "Hamstrings and calves",
    "ex": [
      "leg_press"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2101.JPG",
      "IMG_2102.JPG"
    ],
    "label": "IMG_2102.JPG",
    "evidence": "The machine plaque explicitly reads LEG PRESS."
  },
  {
    "id": "cr-hoist-chin-dip-assist",
    "name": "Hoist ROC-IT Chin / Dip Assist",
    "cat": "Full Body",
    "template": "assist",
    "style": "compound",
    "pattern": "Assisted vertical pull / dip",
    "primary": "Lats or triceps/chest",
    "secondary": "Biceps, shoulders and core",
    "ex": [
      "assisted_pullup",
      "assisted_dip"
    ],
    "zone": "rocit",
    "photos": [
      "IMG_2103.JPG",
      "IMG_2104.JPG"
    ],
    "label": "IMG_2104.JPG",
    "evidence": "The machine plaque explicitly reads CHIN/DIP ASSIST."
  },
  {
    "id": "cr-abcoaster",
    "name": "AbCoaster",
    "cat": "Core",
    "template": "coreCrunch",
    "style": "core",
    "pattern": "Knee raise / trunk flexion",
    "primary": "Abdominals",
    "secondary": "Hip flexors and obliques",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2105.JPG",
      "IMG_2106.JPG"
    ],
    "label": "IMG_2106.JPG",
    "evidence": "The instruction placard explicitly identifies the station as AbCoaster. Guide-only until an exact exercise is added to the exercise library."
  },
  {
    "id": "cr-precor-abx",
    "name": "Precor Ab-X",
    "cat": "Core",
    "template": "coreCrunch",
    "style": "core",
    "pattern": "Supported abdominal crunch",
    "primary": "Abdominals",
    "secondary": "Obliques",
    "ex": [
      "ab_crunch_machine"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2107.JPG",
      "IMG_2108.JPG"
    ],
    "label": "IMG_2108.JPG",
    "evidence": "The product marking and instruction panel identify the Precor Ab-X abdominal station."
  },
  {
    "id": "cr-star-glute-press",
    "name": "Star Trac Glute Press",
    "cat": "Legs",
    "template": "glutePress",
    "style": "isolation",
    "pattern": "Hip extension",
    "primary": "Glutes",
    "secondary": "Hamstrings",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2109.JPG",
      "IMG_2110.JPG",
      "IMG_2111.JPG"
    ],
    "label": "IMG_2111.JPG",
    "evidence": "The machine plaque explicitly reads GLUTE PRESS."
  },
  {
    "id": "cr-star-standing-calf",
    "name": "Star Trac Standing Calf",
    "cat": "Legs",
    "template": "calf",
    "style": "isolation",
    "pattern": "Standing plantar flexion",
    "primary": "Calves",
    "secondary": "Foot and ankle stabilizers",
    "ex": [
      "standing_calf"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2112.JPG",
      "IMG_2113.JPG"
    ],
    "label": "IMG_2113.JPG",
    "evidence": "The machine plaque explicitly reads STANDING CALF."
  },
  {
    "id": "cr-nautilus-leg-extension",
    "name": "Nautilus Leg Extension",
    "cat": "Legs",
    "template": "legExtension",
    "style": "isolation",
    "pattern": "Knee extension",
    "primary": "Quadriceps",
    "secondary": "None significant",
    "ex": [
      "leg_extension"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2114.JPG",
      "IMG_2115.JPG"
    ],
    "label": "IMG_2115.JPG",
    "evidence": "The Nautilus plaque explicitly reads LEG EXTENSION."
  },
  {
    "id": "cr-star-adductor",
    "name": "Star Trac Adductor",
    "cat": "Legs",
    "template": "adductor",
    "style": "isolation",
    "pattern": "Hip adduction",
    "primary": "Inner thighs / adductors",
    "secondary": "Hip stabilizers",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2116.JPG",
      "IMG_2117.JPG"
    ],
    "label": "IMG_2117.JPG",
    "evidence": "The machine plaque explicitly reads ADDUCTOR. It is guide-only because the current exercise library has no exact hip-adduction exercise."
  },
  {
    "id": "cr-star-abductor",
    "name": "Star Trac Abductor",
    "cat": "Legs",
    "template": "abductor",
    "style": "isolation",
    "pattern": "Hip abduction",
    "primary": "Glute medius and minimus",
    "secondary": "Glute max / hip stabilizers",
    "ex": [
      "hip_abduction"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2118.JPG",
      "IMG_2119.JPG"
    ],
    "label": "IMG_2119.JPG",
    "evidence": "The machine plaque explicitly reads ABDUCTOR."
  },
  {
    "id": "cr-star-deltoid-fly",
    "name": "Star Trac Deltoid Fly",
    "cat": "Pull",
    "template": "rearFly",
    "style": "isolation",
    "pattern": "Horizontal shoulder abduction",
    "primary": "Rear deltoids",
    "secondary": "Mid-back",
    "ex": [
      "rear_delt_machine"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2120.JPG",
      "IMG_2121.JPG"
    ],
    "label": "IMG_2121.JPG",
    "evidence": "The machine plaque reads DELTOID FLY; the photographed configuration is the rear-deltoid fly station."
  },
  {
    "id": "cr-star-chest-press",
    "name": "Star Trac Chest Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Horizontal press",
    "primary": "Chest",
    "secondary": "Triceps and front deltoids",
    "ex": [
      "sel_chest_press"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2122.JPG",
      "IMG_2123.JPG"
    ],
    "label": "IMG_2123.JPG",
    "evidence": "The machine plaque explicitly reads CHEST PRESS."
  },
  {
    "id": "cr-star-incline-press",
    "name": "Star Trac Incline Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Incline press",
    "primary": "Upper chest",
    "secondary": "Front deltoids and triceps",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2124.JPG",
      "IMG_2125.JPG"
    ],
    "label": "IMG_2125.JPG",
    "evidence": "The machine plaque explicitly reads INCLINE PRESS. Guide-only because the current library has no selectorized incline-press load profile."
  },
  {
    "id": "cr-star-biceps-curl",
    "name": "Star Trac Biceps Curl",
    "cat": "Pull",
    "template": "curl",
    "style": "isolation",
    "pattern": "Elbow flexion",
    "primary": "Biceps",
    "secondary": "Forearms",
    "ex": [
      "sel_arm_curl"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2126.JPG",
      "IMG_2127.JPG"
    ],
    "label": "IMG_2127.JPG",
    "evidence": "The machine plaque explicitly reads BICEPS CURL."
  },
  {
    "id": "cr-functional-trainer-a",
    "name": "Functional Cable Trainer",
    "cat": "Full Body",
    "template": "cable",
    "style": "utility",
    "pattern": "Adjustable cable resistance",
    "primary": "Varies by exercise",
    "secondary": "Core stabilizers",
    "ex": [
      "cable_crossover",
      "cable_crunch",
      "cable_curl",
      "cable_kickback",
      "cable_lateral",
      "cable_pushdown",
      "cable_rear_delt",
      "cable_row",
      "face_pull",
      "overhead_cable_ext",
      "straight_arm_pulldown"
    ],
    "zone": "cable-smith",
    "photos": [
      "IMG_2128.JPG",
      "IMG_2129.JPG"
    ],
    "label": "IMG_2128.JPG",
    "evidence": "The photographs clearly show a dual adjustable cable station with multi-exercise exercise chart; exact model branding is not sufficiently readable.",
    "confidence": "Medium"
  },
  {
    "id": "cr-smith-machine",
    "name": "Smith Machine / Smith Rack",
    "cat": "Full Body",
    "template": "smith",
    "style": "utility",
    "pattern": "Guided barbell",
    "primary": "Varies by exercise",
    "secondary": "Core and stabilizers",
    "ex": [
      "close_grip_smith",
      "smith_bench",
      "smith_hip_thrust",
      "smith_ohp",
      "smith_rdl",
      "smith_squat"
    ],
    "zone": "cable-smith",
    "photos": [
      "IMG_2130.JPG",
      "IMG_2131.JPG"
    ],
    "label": "IMG_2131.JPG",
    "evidence": "The guided bar path, rails, hooks and bench identify a Smith machine/rack. Exact model is not readable, so the guide is functional rather than model-specific.",
    "confidence": "Medium"
  },
  {
    "id": "cr-plate-loaded-press-unknown",
    "name": "Plate-Loaded Press — Model Unverified",
    "cat": "Push",
    "template": "shoulderPress",
    "style": "compound",
    "pattern": "Pressing movement",
    "primary": "Deltoids / chest depending setup",
    "secondary": "Triceps",
    "ex": [],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2132.JPG"
    ],
    "label": "IMG_2132.JPG",
    "evidence": "The plate-loaded pressing geometry is visible, but the exact exercise/model label is not readable. It is intentionally excluded from automatic programming.",
    "confidence": "Medium",
    "auto": false
  },
  {
    "id": "cr-functional-trainer-b",
    "name": "Dual Adjustable Pulley / Cable Station",
    "cat": "Full Body",
    "template": "cable",
    "style": "utility",
    "pattern": "Adjustable cable resistance",
    "primary": "Varies by exercise",
    "secondary": "Core stabilizers",
    "ex": [
      "cable_crossover",
      "cable_crunch",
      "cable_curl",
      "cable_kickback",
      "cable_lateral",
      "cable_pushdown",
      "cable_rear_delt",
      "cable_row",
      "face_pull",
      "overhead_cable_ext",
      "straight_arm_pulldown"
    ],
    "zone": "cable-smith",
    "photos": [
      "IMG_2142.JPG",
      "IMG_2143.JPG",
      "IMG_2144.JPG"
    ],
    "label": "IMG_2144.JPG",
    "evidence": "The station and instruction panel clearly identify a dual adjustable pulley / cable training station; exact model branding is not sufficiently readable.",
    "confidence": "High"
  },
  {
    "id": "cr-hammer-wide-pulldown",
    "name": "Hammer Strength Iso-Lateral Wide Pulldown",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Wide vertical pull",
    "primary": "Lats and upper back",
    "secondary": "Biceps and rear deltoids",
    "ex": [
      "lat_pulldown",
      "pl_lat_pulldown"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2145.JPG",
      "IMG_2146.JPG",
      "IMG_2147.JPG",
      "IMG_2148.JPG"
    ],
    "label": "IMG_2147.JPG",
    "evidence": "The plaque explicitly reads HAMMER STRENGTH ISO-LATERAL WIDE PULLDOWN."
  },
  {
    "id": "cr-hammer-front-lat-pulldown",
    "name": "Hammer Strength Iso-Lateral Front Lat Pulldown",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Front vertical pull",
    "primary": "Lats",
    "secondary": "Biceps and upper back",
    "ex": [
      "lat_pulldown",
      "pl_lat_pulldown"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2149.JPG",
      "IMG_2150.JPG"
    ],
    "label": "IMG_2149.JPG",
    "evidence": "The plaque explicitly reads ISO-LATERAL FRONT LAT PULLDOWN."
  },
  {
    "id": "cr-hammer-pullover",
    "name": "Hammer Strength Pullover",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Shoulder extension / pullover",
    "primary": "Lats",
    "secondary": "Chest and triceps long head",
    "ex": [],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2151.JPG",
      "IMG_2152.JPG"
    ],
    "label": "IMG_2151.JPG",
    "evidence": "The plaque explicitly identifies the HAMMER STRENGTH PULLOVER. Guide-only because no exact pullover exercise currently exists in the program library."
  },
  {
    "id": "cr-star-leverage-biceps",
    "name": "Star Trac Leverage Biceps Curl",
    "cat": "Pull",
    "template": "curl",
    "style": "isolation",
    "pattern": "Elbow flexion",
    "primary": "Biceps",
    "secondary": "Forearms",
    "ex": [
      "pl_biceps_curl"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2153.JPG",
      "IMG_2154.JPG"
    ],
    "label": "IMG_2154.JPG",
    "evidence": "The plaque explicitly reads LEVERAGE BICEPS CURL. Guide-only to avoid mixing its plate-loaded semantics with selectorized curl logging."
  },
  {
    "id": "cr-star-leverage-high-row",
    "name": "Star Trac Leverage High Row",
    "cat": "Pull",
    "template": "row",
    "style": "compound",
    "pattern": "High row",
    "primary": "Upper back and lats",
    "secondary": "Rear deltoids and biceps",
    "ex": [
      "pl_high_row"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2155.JPG",
      "IMG_2156.JPG",
      "IMG_2157.JPG"
    ],
    "label": "IMG_2157.JPG",
    "evidence": "The plaque explicitly reads LEVERAGE HIGH ROW."
  },
  {
    "id": "cr-star-leverage-lat-pulldown",
    "name": "Star Trac Leverage Lat Pulldown",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Vertical pull",
    "primary": "Lats",
    "secondary": "Biceps and upper back",
    "ex": [
      "lat_pulldown",
      "pl_lat_pulldown"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2158.JPG",
      "IMG_2159.JPG"
    ],
    "label": "IMG_2159.JPG",
    "evidence": "The plaque explicitly reads LEVERAGE LAT PULLDOWN."
  },
  {
    "id": "cr-nautilus-leverage-row",
    "name": "Nautilus Leverage Row",
    "cat": "Pull",
    "template": "row",
    "style": "compound",
    "pattern": "Horizontal pull",
    "primary": "Mid-back and lats",
    "secondary": "Biceps and rear deltoids",
    "ex": [
      "pl_low_row"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2160.JPG",
      "IMG_2161.JPG"
    ],
    "label": "IMG_2161.JPG",
    "evidence": "The Nautilus plaque explicitly reads LEVERAGE ROW."
  },
  {
    "id": "cr-nautilus-decline-press",
    "name": "Nautilus Leverage Decline Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Decline press",
    "primary": "Chest",
    "secondary": "Triceps and front deltoids",
    "ex": [
      "pl_chest_press",
      "pl_decline_press"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2162.JPG",
      "IMG_2163.JPG"
    ],
    "label": "IMG_2163.JPG",
    "evidence": "The Nautilus plaque explicitly reads LEVERAGE DECLINE PRESS."
  },
  {
    "id": "cr-nautilus-chest-press",
    "name": "Nautilus Leverage Chest Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Horizontal press",
    "primary": "Chest",
    "secondary": "Triceps and front deltoids",
    "ex": [
      "pl_chest_press"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2164.JPG",
      "IMG_2165.JPG"
    ],
    "label": "IMG_2165.JPG",
    "evidence": "The Nautilus plaque explicitly reads LEVERAGE CHEST PRESS."
  },
  {
    "id": "cr-leverage-incline-press",
    "name": "Leverage Incline Press",
    "cat": "Push",
    "template": "press",
    "style": "compound",
    "pattern": "Incline press",
    "primary": "Upper chest",
    "secondary": "Front deltoids and triceps",
    "ex": [
      "pl_incline_press"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2166.JPG",
      "IMG_2167.JPG"
    ],
    "label": "IMG_2167.JPG",
    "evidence": "The station plaque explicitly reads LEVERAGE INCLINE PRESS; the photographed badge indicates the Star Trac family."
  },
  {
    "id": "cr-leverage-shoulder-press",
    "name": "Leverage Shoulder Press",
    "cat": "Push",
    "template": "shoulderPress",
    "style": "compound",
    "pattern": "Vertical press",
    "primary": "Deltoids",
    "secondary": "Triceps and upper chest",
    "ex": [
      "pl_shoulder_press"
    ],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2168.JPG",
      "IMG_2169.JPG"
    ],
    "label": "IMG_2169.JPG",
    "evidence": "The station plaque explicitly reads LEVERAGE SHOULDER PRESS."
  },
  {
    "id": "cr-preacher-bench",
    "name": "Preacher Curl Bench",
    "cat": "Pull",
    "template": "utility",
    "style": "utility",
    "pattern": "Supported elbow flexion",
    "primary": "Biceps",
    "secondary": "Forearms",
    "ex": [
      "ez_curl"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2170.JPG"
    ],
    "label": "IMG_2170.JPG",
    "evidence": "The angled arm pad and seat clearly identify a preacher/Scott curl bench.",
    "confidence": "High"
  },
  {
    "id": "cr-fixed-bar-rack",
    "name": "Fixed Barbell / EZ-Curl Bar Rack",
    "cat": "Full Body",
    "template": "utility",
    "style": "utility",
    "pattern": "Free-weight storage",
    "primary": "Varies",
    "secondary": "Varies",
    "ex": [
      "ez_curl"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2171.JPG",
      "IMG_2172.JPG",
      "IMG_2173.JPG"
    ],
    "label": "IMG_2171.JPG",
    "evidence": "The photographs clearly show a rack of fixed straight and EZ-style barbells.",
    "confidence": "High"
  },
  {
    "id": "cr-dumbbell-rack",
    "name": "Dumbbell Rack",
    "cat": "Full Body",
    "template": "utility",
    "style": "utility",
    "pattern": "Free weights",
    "primary": "Varies",
    "secondary": "Core stabilizers",
    "ex": [
      "db_bench",
      "db_curl",
      "db_incline",
      "db_lateral",
      "db_rdl",
      "db_row",
      "db_shoulder_press",
      "db_shrug",
      "db_skullcrusher",
      "goblet_squat",
      "hammer_curl",
      "incline_db_curl",
      "walking_lunge"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2174.JPG"
    ],
    "label": "IMG_2174.JPG",
    "evidence": "The photograph clearly shows the Crunch dumbbell rack and surrounding free-weight area.",
    "confidence": "High"
  },
  {
    "id": "cr-seated-utility-bench",
    "name": "Seated Utility Bench",
    "cat": "Full Body",
    "template": "utility",
    "style": "utility",
    "pattern": "Free-weight support",
    "primary": "Varies",
    "secondary": "Core stabilizers",
    "ex": [
      "db_shoulder_press",
      "db_curl",
      "hammer_curl"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2175.JPG"
    ],
    "label": "IMG_2175.JPG",
    "evidence": "The photograph clearly shows an upright seated utility bench.",
    "confidence": "High"
  },
  {
    "id": "cr-adjustable-bench",
    "name": "Adjustable Bench",
    "cat": "Full Body",
    "template": "utility",
    "style": "utility",
    "pattern": "Flat / incline bench support",
    "primary": "Varies",
    "secondary": "Core stabilizers",
    "ex": [
      "db_bench",
      "db_incline",
      "db_row",
      "db_skullcrusher"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2176.JPG"
    ],
    "label": "IMG_2176.JPG",
    "evidence": "The photograph clearly shows an adjustable free-weight bench.",
    "confidence": "High"
  },
  {
    "id": "cr-star-tilt-seat-calf",
    "name": "Star Trac Tilt Seat Calf",
    "cat": "Legs",
    "template": "calf",
    "style": "isolation",
    "pattern": "Seated plantar flexion",
    "primary": "Calves",
    "secondary": "Foot and ankle stabilizers",
    "ex": [
      "seated_calf"
    ],
    "zone": "free-weights",
    "photos": [
      "IMG_2177.JPG",
      "IMG_2178.JPG"
    ],
    "label": "IMG_2178.JPG",
    "evidence": "The machine plaque explicitly reads TILT SEAT CALF."
  },
  {
    "id": "cr-plate-loaded-dip-unverified",
    "name": "Plate-Loaded Seated Dip — Model Unverified",
    "cat": "Push",
    "template": "dip",
    "style": "compound",
    "pattern": "Seated dip",
    "primary": "Triceps",
    "secondary": "Chest and front deltoids",
    "ex": [],
    "zone": "plate-loaded",
    "photos": [
      "IMG_2179.JPG"
    ],
    "label": "IMG_2179.JPG",
    "evidence": "The plate-loaded seated-dip geometry is visible, but no readable model/function plaque was captured. It remains manual-only.",
    "confidence": "Medium",
    "auto": false
  },
  {
    "id": "cr-hs-leg-extension",
    "name": "Hammer Strength Leg Extension",
    "cat": "Legs",
    "template": "legExtension",
    "style": "isolation",
    "pattern": "Knee extension",
    "primary": "Quadriceps",
    "secondary": "None significant",
    "ex": [
      "leg_extension"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2180.JPG",
      "IMG_2181.JPG"
    ],
    "label": "IMG_2181.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads LEG EXTENSION."
  },
  {
    "id": "cr-hs-leg-curl",
    "name": "Hammer Strength Leg Curl",
    "cat": "Legs",
    "template": "legCurl",
    "style": "isolation",
    "pattern": "Knee flexion",
    "primary": "Hamstrings",
    "secondary": "Calves",
    "ex": [
      "seated_leg_curl"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2182.JPG",
      "IMG_2183.JPG"
    ],
    "label": "IMG_2183.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads LEG CURL."
  },
  {
    "id": "cr-hs-hip-adduction",
    "name": "Hammer Strength Hip Adduction",
    "cat": "Legs",
    "template": "adductor",
    "style": "isolation",
    "pattern": "Hip adduction",
    "primary": "Inner thighs / adductors",
    "secondary": "Hip stabilizers",
    "ex": [
      "hip_adduction"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2184.JPG",
      "IMG_2185.JPG"
    ],
    "label": "IMG_2185.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads HIP ADDUCTION. Guide-only until an exact adduction exercise is added."
  },
  {
    "id": "cr-hs-hip-abduction",
    "name": "Hammer Strength Hip Abduction",
    "cat": "Legs",
    "template": "abductor",
    "style": "isolation",
    "pattern": "Hip abduction",
    "primary": "Glute medius and minimus",
    "secondary": "Glute max / hip stabilizers",
    "ex": [
      "hip_abduction"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2186.JPG",
      "IMG_2187.JPG"
    ],
    "label": "IMG_2187.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads HIP ABDUCTION."
  },
  {
    "id": "cr-hs-pec-rear",
    "name": "Hammer Strength Pectoral Fly / Rear Deltoid",
    "cat": "Push",
    "template": "fly",
    "style": "isolation",
    "pattern": "Fly / reverse fly",
    "primary": "Chest or rear deltoids",
    "secondary": "Front deltoids or mid-back",
    "ex": [
      "pec_deck",
      "rear_delt_machine"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2188.JPG",
      "IMG_2189.JPG"
    ],
    "label": "IMG_2189.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads PECTORAL FLY / REAR DELTOID."
  },
  {
    "id": "cr-hs-row",
    "name": "Hammer Strength Row",
    "cat": "Pull",
    "template": "row",
    "style": "compound",
    "pattern": "Horizontal pull",
    "primary": "Mid-back and lats",
    "secondary": "Biceps and rear deltoids",
    "ex": [
      "sel_seated_row"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2190.JPG",
      "IMG_2191.JPG"
    ],
    "label": "IMG_2191.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads ROW."
  },
  {
    "id": "cr-hs-fixed-pulldown",
    "name": "Hammer Strength Fixed Pulldown",
    "cat": "Pull",
    "template": "pulldown",
    "style": "compound",
    "pattern": "Vertical pull",
    "primary": "Lats",
    "secondary": "Biceps and upper back",
    "ex": [
      "lat_pulldown"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2192.JPG",
      "IMG_2193.JPG"
    ],
    "label": "IMG_2193.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads FIXED PULLDOWN."
  },
  {
    "id": "cr-hs-lateral-raise",
    "name": "Hammer Strength Lateral Raise",
    "cat": "Push",
    "template": "lateralRaise",
    "style": "isolation",
    "pattern": "Shoulder abduction",
    "primary": "Side deltoids",
    "secondary": "Upper traps",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2194.JPG",
      "IMG_2195.JPG"
    ],
    "label": "IMG_2195.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads LATERAL RAISE. Guide-only because no exact selectorized lateral-raise exercise currently exists."
  },
  {
    "id": "cr-hs-biceps-curl",
    "name": "Hammer Strength Biceps Curl",
    "cat": "Pull",
    "template": "curl",
    "style": "isolation",
    "pattern": "Elbow flexion",
    "primary": "Biceps",
    "secondary": "Forearms",
    "ex": [
      "sel_arm_curl"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2198.JPG",
      "IMG_2199.JPG"
    ],
    "label": "IMG_2199.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads BICEPS CURL."
  },
  {
    "id": "cr-hs-seated-leg-press",
    "name": "Hammer Strength Seated Leg Press",
    "cat": "Legs",
    "template": "legPress",
    "style": "compound",
    "pattern": "Knee and hip extension",
    "primary": "Quadriceps and glutes",
    "secondary": "Hamstrings and calves",
    "ex": [
      "leg_press"
    ],
    "zone": "selectorized",
    "photos": [
      "IMG_2200.JPG",
      "IMG_2201.JPG"
    ],
    "label": "IMG_2201.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads SEATED LEG PRESS."
  },
  {
    "id": "cr-cardio-cross-trainers",
    "name": "Cross-Trainer / Elliptical Row",
    "cat": "Cardio",
    "template": "cardio",
    "style": "cardio",
    "pattern": "Low-impact cyclical cardio",
    "primary": "Legs and cardiovascular system",
    "secondary": "Arms depending handles",
    "ex": [],
    "zone": "cardio",
    "photos": [
      "IMG_2214.JPG"
    ],
    "label": "IMG_2214.JPG",
    "evidence": "The photograph clearly shows a row of cross-trainer/elliptical-style cardio machines; exact console/model labels are not readable.",
    "confidence": "Medium",
    "auto": false
  },
  {
    "id": "cr-cardio-steppers",
    "name": "Stair Climber / Stepper Row",
    "cat": "Cardio",
    "template": "cardio",
    "style": "cardio",
    "pattern": "Stepping cardio",
    "primary": "Glutes, quads and cardiovascular system",
    "secondary": "Calves",
    "ex": [],
    "zone": "cardio",
    "photos": [
      "IMG_2215.JPG"
    ],
    "label": "IMG_2215.JPG",
    "evidence": "The photograph shows a row of stair-climber/stepper-style machines; exact model labels are not readable.",
    "confidence": "Medium",
    "auto": false
  },
  {
    "id": "cr-treadmills",
    "name": "Treadmill Row",
    "cat": "Cardio",
    "template": "cardio",
    "style": "cardio",
    "pattern": "Walking / running",
    "primary": "Cardiovascular system and legs",
    "secondary": "Core stabilizers",
    "ex": [
      "treadmill_steady"
    ],
    "zone": "cardio",
    "photos": [
      "IMG_2216.JPG"
    ],
    "label": "IMG_2216.JPG",
    "evidence": "The photograph clearly shows the treadmill row.",
    "confidence": "High"
  },
  {
    "id": "cr-hs-triceps-extension",
    "name": "Hammer Strength Triceps Extension",
    "cat": "Push",
    "template": "triceps",
    "style": "isolation",
    "pattern": "Elbow extension",
    "primary": "Triceps",
    "secondary": "Forearms",
    "ex": [],
    "zone": "selectorized",
    "photos": [
      "IMG_2217.JPG",
      "IMG_2218.JPG"
    ],
    "label": "IMG_2218.JPG",
    "evidence": "The Hammer Strength plaque explicitly reads TRICEPS EXTENSION. Guide-only because the current exercise library has no exact selectorized triceps-extension movement."
  }
];
  var COLORS = { Push:'#B86752', Pull:'#557DA4', Legs:'#8A73A6', Core:'#5E9273', 'Full Body':'#9A7B47', Cardio:'#4C8790' };

  function photo(name, alt) {
    var id = PHOTO_IDS[name];
    return {
      filename:name,
      number:Number((name.match(/_(\d{4})/)||[])[1]||0),
      webp:id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200' : '',
      // List cards render ~300 CSS px wide; a 480 px thumbnail stays sharp on
      // phones at a fraction of the 1200 px detail image's download size.
      thumb:id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w480' : '',
      alt:alt + ' — ' + name,
      crossReference:false
    };
  }

  var T = {
    press:{
      setup:['Set the seat so the handles line up with the intended chest level and both feet stay planted.','Start with shoulder blades gently back/down and wrists stacked over forearms.','Use a load that leaves about 1–3 good repetitions in reserve on work sets.'],
      exec:[['Start','Brace, keep the upper back against the pad and take a controlled starting stretch.'],['Move','Press smoothly without bouncing or shrugging; keep elbows tracking comfortably below shoulder height.'],['Finish','Stop just short of a hard elbow lockout, then return under control to the same pain-free depth.']],
      cues:['Chest tall','Wrists stacked','Controlled return'],mistakes:[['Seat too low/high','Reset the seat so the pressing path matches the machine handles and your shoulder stays comfortable.'],['Bouncing from the bottom','Pause briefly and reverse the weight with control.'],['Shoulders rolling forward','Keep the upper back planted and shoulder blades stable.']]
    },
    shoulderPress:{
      setup:['Set the seat so the handles begin around shoulder/ear level without forcing a deep stretch.','Keep ribs stacked over pelvis and feet planted.','Choose a neutral or comfortable grip if the machine offers options.'],
      exec:[['Start','Brace the trunk and keep the head/upper back supported.'],['Move','Press upward smoothly while keeping elbows under the handles.'],['Finish','Stop short of aggressive lockout; lower under control until the shoulders remain comfortable.']],
      cues:['Ribs down','Elbows under handles','No shrugging'],mistakes:[['Overarching the low back','Reduce load and keep ribs stacked over pelvis.'],['Shrugging','Think shoulders down while the arms press.'],['Dropping too deep','Use the deepest pain-free range you can control.']]
    },
    fly:{
      setup:['Adjust the seat so the handles/pads line up near mid-chest or rear-shoulder level for the selected mode.','Use a light-to-moderate load; fly movements do not need maximal loading.','Keep the torso fully supported.'],
      exec:[['Start','Set the shoulders gently back/down and keep a soft elbow bend.'],['Move','Sweep the arms through the intended arc without changing elbow angle much.'],['Finish','Squeeze briefly, then return slowly until you feel a controlled stretch.']],
      cues:['Soft elbows','Move from the shoulder','Slow stretch'],mistakes:[['Turning it into a press','Keep the elbow angle nearly fixed.'],['Using momentum','Lower the load and control both directions.'],['Overstretching','Stop before the front of the shoulder feels strained.']]
    },
    rearFly:{
      setup:['Set seat/pads so the handles line up near shoulder height.','Keep chest supported and select a load you can move without torso swing.','Use a neutral grip if available and comfortable.'],
      exec:[['Start','Reach forward with a soft elbow and brace against the pad.'],['Move','Drive the arms outward/back by moving at the shoulder, not by extending the elbow.'],['Finish','Pause with rear delts/mid-back contracted, then return slowly.']],
      cues:['Chest on pad','Lead with elbows','No torso swing'],mistakes:[['Shrugging','Keep shoulders away from ears.'],['Hyperextending the back','Stay firmly supported by the chest pad.'],['Too much weight','Reduce load until the rear delts control the motion.']]
    },
    row:{
      setup:['Adjust the seat/chest pad so you can reach the handles without rounding the low back.','Brace the torso and use a grip that keeps shoulders comfortable.','Start with arms long but shoulders not dumped forward.'],
      exec:[['Start','Brace and let the shoulder blades reach slightly forward.'],['Move','Pull elbows back toward the hip/rib line while keeping the torso stable.'],['Finish','Pause without overextending the spine; return until the lats/mid-back stretch under control.']],
      cues:['Chest supported','Elbows drive','Control the reach'],mistakes:[['Torso rocking','Lower the load and keep contact with the pad.'],['Shrugging','Pull shoulders down and back rather than toward the ears.'],['Short range','Allow a controlled reach and full pull without losing posture.']]
    },
    pulldown:{
      setup:['Set thigh/seat pads so the body is secure and feet are planted.','Choose the handle/grip shown on the machine and keep shoulders comfortable.','Begin tall with arms extended and ribs stacked.'],
      exec:[['Start','Brace and set shoulders down without leaning far back.'],['Move','Drive elbows down toward the ribs/hips.'],['Finish','Pause when the elbows cannot travel farther without torso swing, then return slowly to a full controlled reach.']],
      cues:['Elbows down','Tall torso','Full controlled stretch'],mistakes:[['Swinging backward','Reduce load and keep torso angle nearly fixed.'],['Pulling with hands only','Think about driving elbows down.'],['Cutting the stretch','Return until arms are long while shoulders remain controlled.']]
    },
    curl:{
      setup:['Align the elbow joint with the machine pivot/pad where applicable.','Keep the upper arm supported and wrists neutral.','Use a load that lets you keep the elbow position fixed.'],
      exec:[['Start','Begin with a controlled stretch without hyperextending the elbow.'],['Move','Curl by flexing the elbow while the upper arm stays planted.'],['Finish','Squeeze briefly, then lower for a full controlled eccentric.']],
      cues:['Elbows fixed','Wrists neutral','Slow lower'],mistakes:[['Lifting the elbows','Keep the upper arm on the pad/support.'],['Wrist curling','Keep knuckles and forearm aligned.'],['Dropping the weight','Take 2–3 seconds on the lowering phase.']]
    },
    triceps:{
      setup:['Align elbows with the machine pivot/support and set the seat so the upper arms stay stable.','Keep wrists neutral and shoulders relaxed.','Use a load that allows complete elbow extension without trunk movement.'],
      exec:[['Start','Begin with elbows flexed in a comfortable range.'],['Move','Extend the elbows while keeping the upper arms fixed.'],['Finish','Squeeze the triceps without slamming lockout, then return slowly.']],
      cues:['Upper arms still','Extend, do not shove','Slow return'],mistakes:[['Shoulders taking over','Reduce load and keep upper arms supported.'],['Hard elbow lockout','Finish smoothly without snapping the joint.'],['Partial reps','Use the full controlled range the machine allows.']]
    },
    dip:{
      setup:['Set seat/handles so shoulders are comfortable and feet remain stable.','Keep chest tall and elbows tracking naturally behind/beside the torso.','Start light enough to avoid shoulder strain.'],
      exec:[['Start','Brace and set shoulders down.'],['Move','Drive the handles down/back by extending the elbows.'],['Finish','Stop before aggressive lockout and return slowly until a comfortable stretch is reached.']],
      cues:['Shoulders down','Elbows track naturally','No bounce'],mistakes:[['Shoulders rolling forward','Keep upper back set and reduce depth if needed.'],['Using body momentum','Stay seated and control the return.'],['Excessive depth','Use a pain-free shoulder range.']]
    },
    legExtension:{
      setup:['Align the knee joint with the machine pivot.','Place the shin pad just above the ankle and secure the back/seat position.','Start with a knee angle that is comfortable and does not force the joint.'],
      exec:[['Start','Brace against the pad and keep hips down.'],['Move','Extend the knees smoothly until almost straight.'],['Finish','Squeeze the quads briefly, then lower under control to the same start angle.']],
      cues:['Knees at pivot','Hips stay down','Squeeze quads'],mistakes:[['Seat/pivot misaligned','Readjust before adding load.'],['Kicking the weight','Use a smooth acceleration and controlled return.'],['Slamming lockout','Stop just short of a hard knee lockout.']]
    },
    legCurl:{
      setup:['Align the knee with the machine pivot and position the roller just above the heel/lower calf.','Secure the thigh/hip pads and keep the pelvis against the seat/pad.','Set the start so the hamstrings can lengthen without knee discomfort.'],
      exec:[['Start','Brace and keep hips still.'],['Move','Curl the heel toward the seat/pad by flexing the knee.'],['Finish','Squeeze the hamstrings, then return slowly to a controlled stretch.']],
      cues:['Knee at pivot','Hips still','Slow eccentric'],mistakes:[['Hips lifting','Reduce load and tighten the pad/brace.'],['Too-short range','Use the full pain-free arc.'],['Dropping the stack','Control the last half of the return.']]
    },
    legPress:{
      setup:['Set the seat/back so the bottom position gives a comfortable hip and knee bend without pelvis rounding.','Place feet symmetrically and keep knees tracking with toes.','Do not unlock or reposition safety stops under load.'],
      exec:[['Start','Brace the torso and keep the whole foot planted.'],['Move','Press the platform away by extending knees and hips.'],['Finish','Stop short of hard knee lockout; lower until just before the pelvis begins to tuck/round.']],
      cues:['Whole foot','Knees track toes','Pelvis stays planted'],mistakes:[['Knees collapsing inward','Reduce load and track knees over toes.'],['Butt rounding at depth','Shorten range or adjust seat.'],['Locking knees hard','Finish with soft knees.']]
    },
    calf:{
      setup:['Place the balls of the feet securely on the platform/pad and align the machine pads comfortably.','Start with ankles in a controlled stretch and knees in the intended machine position.','Use a load that allows a pause at both ends.'],
      exec:[['Start','Lower heels under control into a comfortable stretch.'],['Move','Press through the balls of the feet and rise as high as possible.'],['Finish','Pause at the top, then lower slowly back to the stretch.']],
      cues:['Full stretch','High squeeze','No bouncing'],mistakes:[['Bouncing','Pause briefly at bottom and top.'],['Rolling ankles','Keep pressure through the big-toe and little-toe bases.'],['Tiny range','Use the largest controlled ankle range available.']]
    },
    adductor:{
      setup:['Set the start width conservatively; a deeper stretch is not automatically better.','Sit tall with pelvis and back supported.','Place the inner thighs/knees against the pads as designed.'],
      exec:[['Start','Brace and hold the handles.'],['Move','Bring the pads inward by squeezing the inner thighs.'],['Finish','Pause, then let the legs open slowly to a comfortable stretch.']],
      cues:['Tall torso','Squeeze inward','Controlled stretch'],mistakes:[['Forcing excessive start width','Choose a comfortable range.'],['Bouncing the pads','Slow the return.'],['Leaning forward to finish','Keep pelvis/back supported.']]
    },
    abductor:{
      setup:['Set the start position so hips remain comfortable.','Sit tall or in the posture shown by the machine instructions.','Keep feet/knees placed against the pads as designed.'],
      exec:[['Start','Brace and grip the handles.'],['Move','Drive the pads outward using the side glutes.'],['Finish','Pause open, then return slowly without letting the stack crash.']],
      cues:['Drive from hips','Pelvis steady','Slow return'],mistakes:[['Using momentum','Lower the load and pause at end range.'],['Feet doing the work','Think about moving from the hip.'],['Stack crashing','Control the inward return.']]
    },
    glutePress:{
      setup:['Adjust torso/foot support so the working hip starts flexed without low-back rounding.','Keep the pelvis square to the machine.','Use a moderate load until the path feels stable.'],
      exec:[['Start','Brace the trunk with the working foot/leg secured.'],['Move','Drive through hip extension without twisting the pelvis.'],['Finish','Squeeze the glute, stop before low-back extension, then return under control.']],
      cues:['Pelvis square','Drive with glute','No low-back swing'],mistakes:[['Arching the low back','Reduce range/load and finish with the hip.'],['Twisting','Keep both hip points facing forward.'],['Rushing return','Control the eccentric.']]
    },
    coreCrunch:{
      setup:['Adjust seat/pads exactly as the station diagram shows and begin with a neutral, braced trunk.','Choose a light load first; core machines can feel very different between models.','Use the dedicated rotation/seat mechanism only as instructed on the placard.'],
      exec:[['Start','Brace and exhale gently before moving.'],['Move','Shorten the rib-to-pelvis distance or follow the guided knee/torso path without yanking with the arms.'],['Finish','Pause in the shortened position, then return slowly to neutral without overextending the low back.']],
      cues:['Ribs toward pelvis','Move with abs','Slow return'],mistakes:[['Pulling with arms/neck','Keep the effort in the trunk.'],['Using momentum','Reduce load and pause at both ends.'],['Overextending at the start','Return only to neutral/comfortable extension.']]
    },
    assist:{
      setup:['Select assistance before stepping onto the platform/knee pad. More selected weight generally means more assistance.','Use the prescribed handles and keep the torso controlled.','Enter and exit the moving assist platform carefully.'],
      exec:[['Start','Set the shoulders and brace before each rep.'],['Move','For pull-ups, drive elbows down; for dips, extend elbows while shoulders stay controlled.'],['Finish','Use a full pain-free range and let the assist mechanism return smoothly.']],
      cues:['Assistance is opposite load','Control the platform','No swinging'],mistakes:[['Treating assistance like resistance','Remember: a higher stack setting makes the movement easier.'],['Swinging','Slow the rep and brace.'],['Jumping off the pad','Stop the machine and exit carefully.']]
    },
    lateralRaise:{
      setup:['Set the seat/pads so the shoulder joint lines up naturally with the machine arms.','Use a light-to-moderate load; side delts respond well without heavy swinging.','Keep shoulders down away from ears.'],
      exec:[['Start','Brace with elbows/pads slightly out from the torso.'],['Move','Raise the arms out to the sides in the machine path.'],['Finish','Stop around shoulder height or your comfortable range, then lower slowly.']],
      cues:['Lead with elbows','Shoulders down','Slow lower'],mistakes:[['Shrugging','Reduce load and keep traps relaxed.'],['Swinging','Use less weight and pause at the top.'],['Going too high','Stop at a comfortable shoulder height.']]
    },
    cable:{
      setup:['Set each pulley height, attachment and pin symmetrically for the chosen exercise.','Check the cable/attachment and keep the working area clear.','Stand or brace far enough away to keep tension without the stack touching down between reps.'],
      exec:[['Start','Set your stance and brace before loading the cable.'],['Move','Follow the selected exercise path while the torso stays controlled.'],['Finish','Return the attachment slowly and keep fingers away from pulleys/stack.']],
      cues:['Cable stays taut','Stable stance','Control the stack'],mistakes:[['Wrong pulley height','Match the pulley to the exercise setup.'],['Stack slamming','Slow the eccentric.'],['Standing in another cable path','Keep your working lane clear.']]
    },
    smith:{
      setup:['Set the bench/foot position, safeties and bar hooks before loading.','Test the hook direction with an empty/light bar.','Center the body under the fixed bar path and use collars if the facility requires them.'],
      exec:[['Start','Brace and unrack by rotating the bar only after confirming the safeties.'],['Move','Follow the fixed vertical/slanted path with joint positions appropriate to the selected exercise.'],['Finish','Re-rack deliberately on both hooks and confirm engagement before letting go.']],
      cues:['Set safeties first','Know hook direction','Re-rack both sides'],mistakes:[['No safety setup','Set stops before challenging sets.'],['Fighting the bar path','Adjust stance/bench to the rail angle.'],['One hook misses','Visually confirm both hooks before releasing the bar.']]
    },
    utility:{
      setup:['Inspect the bench/rack and confirm adjustment pins are fully engaged.','Keep the lifting area clear and return weights to storage after use.','For free weights, choose a starting load that preserves stable technique and full control.'],
      exec:[['Start','Set the equipment and body position before lifting.'],['Move','Perform the selected exercise with the range and technique shown in its exercise demo.'],['Finish','Place weights down under control and re-rack safely.']],
      cues:['Pins locked','Stable setup','Re-rack safely'],mistakes:[['Loose adjustment pin','Stop and lock the bench/rack before use.'],['Weights blocking walkways','Keep the area clear.'],['Load before setup','Finish the setup first, then load.']]
    },
    cardio:{
      setup:['Choose a machine with clear belt/step/pedal area and familiarize yourself with stop controls.','Begin at an easy pace for 3–5 minutes.','Use handrails for balance when mounting/dismounting, not to artificially support hard work.'],
      exec:[['Start','Build gradually from an easy warm-up.'],['Move','Use a sustainable rhythm appropriate to the day’s goal.'],['Finish','Reduce intensity for a short cool-down before stepping off.']],
      cues:['Build gradually','Conversational easy work','Cool down'],mistakes:[['Starting too hard','Use the first minutes as a warm-up.'],['Hanging on rails','Lower intensity so posture stays natural.'],['Stopping abruptly after hard work','Cool down gradually.']]
    }
  };

  function programming(style) {
    if (style === 'compound') return 'Usually 2–4 working sets of about 6–12 reps, stopping around 1–3 reps in reserve. Rest roughly 2–3 minutes for hard compound work.';
    if (style === 'isolation') return 'Usually 2–4 working sets of about 10–20 controlled reps, stopping around 1–3 reps in reserve. Rest roughly 60–120 seconds.';
    if (style === 'core') return 'Use 2–4 controlled sets. Progress range, reps or resistance without sacrificing trunk control.';
    if (style === 'cardio') return 'For general conditioning, use mostly easy-to-moderate work plus optional short harder intervals when recovery allows.';
    return 'Use the station as support for the exercise prescription shown by the coach; progression belongs to the exercise, not the storage/support equipment.';
  }
  function placement(cat, style) {
    if (style === 'compound') return 'Place early to mid-session, after the general warm-up and any higher-priority compound lift.';
    if (style === 'isolation') return 'Place after the main compound work for that muscle group.';
    if (style === 'core') return 'Place after main lifting or in a short dedicated core block.';
    if (style === 'cardio') return 'Use after lifting for conditioning, or in a separate cardio session.';
    if (cat === 'Full Body') return 'Use wherever the selected exercise appears in the programmed session.';
    return 'Use according to the coach’s exercise order.';
  }
  function expand(r, i) {
    var tpl=T[r.template]||T.utility;
    var confidence=r.confidence||'High';
    return {
      id:r.id, slug:r.id, gymId:'crunch', no:i+1, identity:r.name,
      aliases:[r.name.replace(/^(Hoist ROC-IT|Hammer Strength|Star Trac|Nautilus|Precor)\s+/,'')],
      category:r.cat, categoryColor:COLORS[r.cat], purpose:r.pattern + ' station for ' + r.primary + '.',
      movementPattern:r.pattern, difficulty:(r.style==='utility'?'All levels':(r.style==='compound'?'Beginner to intermediate':'Beginner-friendly')),
      evidence:{confidence:confidence,summary:r.evidence},
      photos:r.photos.map(function(n){return photo(n,r.name);}),
      callouts:[], muscles:{primary:r.primary,secondary:r.secondary},
      adjustmentsAndChecks:tpl.setup.slice(),
      execution:tpl.exec.map(function(x){return {phase:x[0],instruction:x[1]};}),
      cues:tpl.cues.slice(), breathing:'Exhale through the hard part of the repetition; inhale during the controlled return. Avoid prolonged breath-holding unless you deliberately use an appropriate brace for a heavy compound set.',
      tempo:(r.style==='cardio'?'Smooth sustainable rhythm':'About 1–2 seconds up / 2–3 seconds down unless the exercise calls for another tempo'),
      rangeOfMotion:'Use the largest pain-free range you can control while maintaining the machine alignment and intended joint path.',
      mistakes:tpl.mistakes.map(function(x){return {mistake:x[0],correction:x[1]};}),
      safety:'Inspect pins, pads, cables, plates and stops before use. Stop for sharp pain, chest pain, faintness, or unusual shortness of breath.',
      programming:programming(r.style),
      progression:(r.style==='cardio'?'Progress one variable at a time: duration, pace/resistance, or interval density while keeping recovery adequate.':'When every work set reaches the top of the rep range with at least ~1 rep in reserve, add the smallest practical load next time. If performance falls below range for repeated sessions, reduce load and rebuild clean reps.'),
      workoutPlacement:placement(r.cat,r.style),
      alternatives:[],
      linkedExerciseIds:r.ex.slice(),
      zoneId:r.zone,
      autoEligible:r.auto!==false && confidence==='High',
      source:'Crunch Fitness photo audit',
      labelPhoto:r.label
    };
  }

  // The observed rack establishes dumbbell availability for the complete exercise
  // library; a unique equipment photograph per movement is neither necessary nor
  // implied. Bench-dependent movements also map to the photographed benches.
  var dumbbellLibrary=(window.DUMBBELL_EXERCISES||[]);
  var rackRaw=RAW.filter(function(item){return item.id==='cr-dumbbell-rack';})[0];
  var adjustableBenchRaw=RAW.filter(function(item){return item.id==='cr-adjustable-bench';})[0];
  var seatedBenchRaw=RAW.filter(function(item){return item.id==='cr-seated-utility-bench';})[0];
  if(rackRaw) rackRaw.ex=dumbbellLibrary.map(function(ex){return ex.id;});
  if(adjustableBenchRaw) adjustableBenchRaw.ex=Array.from(new Set(adjustableBenchRaw.ex.concat(dumbbellLibrary.filter(function(ex){return ex.requiresBench;}).map(function(ex){return ex.id;}))));
  if(seatedBenchRaw) seatedBenchRaw.ex=Array.from(new Set(seatedBenchRaw.ex.concat(dumbbellLibrary.filter(function(ex){return ex.requiresBench&&['Shoulders','Arms'].indexOf(ex.family)>=0;}).map(function(ex){return ex.id;}))));

  window.CRUNCH_GUIDES=RAW.map(expand);
  window.CRUNCH_EQUIPMENT=window.CRUNCH_GUIDES.map(function(g){
    return {id:g.id,guideId:g.id,name:g.identity,type:'Crunch Fitness',category:g.category,categoryColor:g.categoryColor,
      photo:g.photos[0]&&g.photos[0].webp,photos:g.photos.map(function(p){return p.webp;}),sourceFiles:g.photos.map(function(p){return p.filename;}),
      exerciseIds:g.autoEligible?g.linkedExerciseIds.slice():[],confidence:g.evidence.confidence,verified:g.evidence.confidence==='High',
      autoEligible:g.autoEligible,zoneId:g.zoneId,gymId:'crunch'};
  });
  // Observed free floor/turf makes bodyweight work available even though it is not a machine guide.
  window.CRUNCH_EQUIPMENT.push({id:'cr-bodyweight-space',name:'Open floor / turf space',type:'Training area',category:'Full Body',
    photo:(window.CRUNCH_GUIDES.filter(function(g){return g.id==='cr-plate-loaded-dip-unverified';})[0]||{photos:[]}).photos[0]?.webp||'',
    photos:[],sourceFiles:['IMG_2179.JPG'],exerciseIds:['pushup','plank','dead_bug','russian_twist','lying_leg_raise','walking_lunge','bulgarian_split'],
    confidence:'Observed',verified:true,autoEligible:true,zoneId:'free-weights',gymId:'crunch'});

  window.CRUNCH_MAP={
    title:'Crunch equipment zones',
    method:'Schematic / not to scale. GPS anchors the venue only; indoor machine placement comes from EXIF capture time/direction, consecutive-photo order and visible neighboring equipment.',
    exif:{photoCount:140,captured:'2026-09-22 20:58–22:39',gpsMedianErrorM:22.6,gpsMinErrorM:15.0,gpsMaxErrorM:191.2},
    zones:[
      {id:'rocit',name:'Hoist / selectorized row',order:1,ranges:['2079–2104','2202–2213'],note:'Hoist ROC-IT cluster plus Hammer Strength chest press; revisited near the end of the photo walk.'},
      {id:'selectorized',name:'Selectorized strength',order:2,ranges:['2105–2127','2180–2201','2217–2218'],note:'Star Trac, Nautilus and Hammer Strength pin-loaded stations.'},
      {id:'cable-smith',name:'Cable + Smith',order:3,ranges:['2128–2131','2142–2144'],note:'Functional trainers / dual adjustable pulleys and Smith station.'},
      {id:'plate-loaded',name:'Plate-loaded strength',order:4,ranges:['2132–2169','2179'],note:'Hammer Strength, Star Trac and Nautilus leverage/plate-loaded stations. Unverified pieces are excluded from automatic programming.'},
      {id:'free-weights',name:'Free weights + benches',order:5,ranges:['2170–2178'],note:'Preacher bench, fixed bars, dumbbells, utility benches and seated calf.'},
      {id:'cardio',name:'Cardio row',order:6,ranges:['2214–2216'],note:'Cross-trainer/elliptical-style row, steppers/stair climbers and treadmills.'}
    ]
  };
  window.CRUNCH_GYM={id:'crunch',name:'Crunch Fitness',guideCount:window.CRUNCH_GUIDES.length,photoCount:140,map:window.CRUNCH_MAP};
})();
