"""
QAZGOST AI - Volume Calculator Service

Calculate volumes of construction objects from measurements.
"""

import math
from typing import Optional, Dict, Any
from loguru import logger


class VolumeCalculator:
    """
    Calculate volumes for various construction objects.
    
    Supports:
    - Trenches (rectangular, trapezoidal)
    - Pits (rectangular, circular)
    - Foundations
    - Pipes
    - Backfill volumes
    """
    
    # Slope angles by soil type (degrees)
    SLOPE_ANGLES = {
        "sand": 45,
        "clay": 60,
        "loam": 56,
        "rock": 75,
        "default": 50
    }
    
    # Standard pipe dimensions
    PIPE_DIMENSIONS = {
        "pipe_pvc_100": {"outer_diameter": 0.110, "wall_thickness": 0.005},
        "pipe_pvc_150": {"outer_diameter": 0.160, "wall_thickness": 0.006},
        "pipe_pvc_200": {"outer_diameter": 0.200, "wall_thickness": 0.007},
        "pipe_metal_100": {"outer_diameter": 0.108, "wall_thickness": 0.004},
        "pipe_hdpe_110": {"outer_diameter": 0.110, "wall_thickness": 0.010},
    }
    
    def __init__(self, scale_factor: Optional[float] = None):
        """
        Initialize calculator.
        
        Args:
            scale_factor: Meters per pixel (for converting pixel measurements)
        """
        self.scale_factor = scale_factor

    def calculate(self, detection, calculate_depth: bool = True) -> Dict[str, Any]:
        """
        Calculate real-world dimensions for a Detection object.

        Converts pixel bbox to meters using scale_factor, then computes
        area and volume.

        Args:
            detection:       Detection object with .bbox, .width, .height, .class_name, .area_px
            calculate_depth: Whether to estimate depth/volume

        Returns:
            {"width_m", "height_m", "depth_m", "area_m2", "volume_m3"}
        """
        sf = self.scale_factor or 0.005  # fallback ~5mm/px

        width_m = detection.width * sf
        height_m = detection.height * sf

        # Area from mask (area_px) if available, otherwise bbox
        area_m2 = detection.area_px * sf * sf if detection.area_px else width_m * height_m

        depth_m = None
        volume_m3 = None

        if calculate_depth:
            obj_type = detection.class_name
            # Use calculate_volume for known types
            try:
                vol = self.calculate_volume(
                    object_type=obj_type,
                    width_m=width_m,
                    height_m=height_m,
                )
                if isinstance(vol, dict):
                    volume_m3 = sum(v for v in vol.values() if isinstance(v, (int, float)))
                else:
                    volume_m3 = float(vol)
                # Estimate depth from volume and area
                if area_m2 > 0 and volume_m3:
                    depth_m = volume_m3 / area_m2
            except Exception:
                # Fallback: assume 1m depth
                depth_m = 1.0
                volume_m3 = area_m2 * depth_m

        return {
            "width_m": round(width_m, 3),
            "height_m": round(height_m, 3),
            "depth_m": round(depth_m, 3) if depth_m else None,
            "area_m2": round(area_m2, 3),
            "volume_m3": round(volume_m3, 3) if volume_m3 else None,
        }
    
    def calculate_volume(
        self,
        object_type: str,
        width_m: float,
        height_m: float,
        depth_m: Optional[float] = None,
        **kwargs
    ) -> float:
        """
        Calculate volume based on object type.
        
        Args:
            object_type: Type of object (trench, pit, foundation, etc.)
            width_m: Width in meters
            height_m: Height/length in meters
            depth_m: Depth in meters (for excavations)
            **kwargs: Additional parameters per object type
        
        Returns:
            Volume in cubic meters
        """
        if object_type == "trench":
            return self.trench_volume(
                length=height_m,  # Height in image = length in real world
                width=width_m,
                depth=depth_m or 1.0,
                **kwargs
            )
        
        elif object_type == "pit":
            return self.pit_volume(
                length=height_m,
                width=width_m,
                depth=depth_m or 1.5,
                **kwargs
            )
        
        elif object_type == "foundation":
            return self.foundation_volume(
                length=height_m,
                width=width_m,
                depth=depth_m or 0.5,
                **kwargs
            )
        
        elif object_type.startswith("pipe"):
            return self.pipe_volume(
                length=max(width_m, height_m),
                pipe_type=object_type,
                **kwargs
            )
        
        else:
            # Default: simple rectangular volume
            return width_m * height_m * (depth_m or 1.0)
    
    def trench_volume(
        self,
        length: float,
        width: float,
        depth: float,
        slope_angle: Optional[float] = None,
        soil_type: str = "default"
    ) -> Dict[str, float]:
        """
        Calculate trench excavation volume.
        
        For trenches with sloped walls:
        V = L × (W_top × D + (W_bottom - W_top) × D / 2)
        
        Returns dict with excavation and backfill volumes.
        """
        if slope_angle is None:
            slope_angle = self.SLOPE_ANGLES.get(soil_type, self.SLOPE_ANGLES["default"])
        
        # Calculate width at bottom (accounting for slopes)
        slope_offset = depth * math.tan(math.radians(90 - slope_angle))
        width_bottom = width - 2 * slope_offset
        
        # Ensure minimum width
        width_bottom = max(width_bottom, 0.3)
        
        # Cross-section area (trapezoid)
        cross_section = (width + width_bottom) / 2 * depth
        
        # Total excavation volume
        excavation_volume = length * cross_section
        
        return round(excavation_volume, 2)
    
    def pit_volume(
        self,
        length: float,
        width: float,
        depth: float,
        shape: str = "rectangle",
        slope_angle: Optional[float] = None
    ) -> float:
        """
        Calculate pit/foundation excavation volume.
        
        Supports rectangular and circular pits.
        """
        if shape == "circle":
            # Use width as diameter
            radius = width / 2
            area = math.pi * radius ** 2
            volume = area * depth
        
        elif shape == "rectangle":
            # Simple rectangular pit
            if slope_angle:
                # Pyramidal frustum
                slope_offset = depth * math.tan(math.radians(90 - slope_angle))
                
                length_bottom = length - 2 * slope_offset
                width_bottom = width - 2 * slope_offset
                
                # Ensure minimum dimensions
                length_bottom = max(length_bottom, 0.5)
                width_bottom = max(width_bottom, 0.5)
                
                # Frustum volume formula
                area_top = length * width
                area_bottom = length_bottom * width_bottom
                area_mid = math.sqrt(area_top * area_bottom)
                
                volume = (depth / 3) * (area_top + area_bottom + area_mid)
            else:
                volume = length * width * depth
        
        else:
            volume = length * width * depth
        
        return round(volume, 2)
    
    def foundation_volume(
        self,
        length: float,
        width: float,
        depth: float,
        foundation_type: str = "strip",
        wall_thickness: float = 0.4
    ) -> float:
        """
        Calculate foundation concrete volume.
        
        Types:
        - strip: Ленточный фундамент
        - slab: Плитный фундамент
        - pile: Свайный фундамент (returns grillage volume)
        """
        if foundation_type == "strip":
            # Strip foundation: perimeter × thickness × depth
            perimeter = 2 * (length + width)
            volume = perimeter * wall_thickness * depth
        
        elif foundation_type == "slab":
            # Slab foundation: area × depth
            volume = length * width * depth
        
        elif foundation_type == "pile":
            # Pile cap/grillage volume (simplified)
            volume = length * width * depth * 0.3  # 30% fill factor
        
        else:
            volume = length * width * depth
        
        return round(volume, 2)
    
    def pipe_volume(
        self,
        length: float,
        pipe_type: str = "pipe_pvc",
        outer_diameter: Optional[float] = None,
        wall_thickness: Optional[float] = None
    ) -> float:
        """
        Calculate pipe material volume.
        
        Returns volume of pipe material (wall), not internal capacity.
        """
        # Get dimensions from catalog or use provided
        if pipe_type in self.PIPE_DIMENSIONS:
            dims = self.PIPE_DIMENSIONS[pipe_type]
            outer_d = outer_diameter or dims["outer_diameter"]
            wall_t = wall_thickness or dims["wall_thickness"]
        else:
            outer_d = outer_diameter or 0.1  # Default 100mm
            wall_t = wall_thickness or 0.005  # Default 5mm wall
        
        outer_r = outer_d / 2
        inner_r = outer_r - wall_t
        
        # Pipe wall volume
        volume = length * math.pi * (outer_r**2 - inner_r**2)
        
        return round(volume, 4)
    
    def pipe_trench_volume(
        self,
        pipe_length: float,
        pipe_diameter: float,
        trench_depth: float = None,
        bedding_thickness: float = 0.15
    ) -> Dict[str, float]:
        """
        Calculate volumes for pipe laying in trench.
        
        Returns:
        - trench_excavation: Total excavation volume
        - pipe_bedding: Sand/gravel under pipe
        - backfill: Material to fill around pipe
        """
        # Calculate trench dimensions
        # Width = pipe diameter + 0.4m working space
        trench_width = pipe_diameter + 0.4
        
        # Depth = pipe diameter + bedding + cover (0.7m min)
        if trench_depth is None:
            trench_depth = pipe_diameter + bedding_thickness + 0.7
        
        # Excavation
        excavation = self.trench_volume(
            length=pipe_length,
            width=trench_width,
            depth=trench_depth
        )
        
        # Bedding (sand layer under and around pipe)
        bedding = pipe_length * trench_width * bedding_thickness
        
        # Pipe cross-section area
        pipe_area = math.pi * (pipe_diameter / 2) ** 2
        
        # Backfill = trench - pipe - bedding
        backfill = excavation - (pipe_length * pipe_area) - bedding
        
        return {
            "trench_excavation_m3": round(excavation, 2),
            "pipe_bedding_m3": round(bedding, 2),
            "backfill_m3": round(max(0, backfill), 2)
        }
    
    def sand_bedding_volume(
        self,
        area_m2: float,
        thickness: float = 0.1
    ) -> float:
        """Calculate volume of sand bedding layer."""
        return round(area_m2 * thickness, 2)
    
    def gravel_bedding_volume(
        self,
        area_m2: float,
        thickness: float = 0.15
    ) -> float:
        """Calculate volume of gravel bedding layer."""
        return round(area_m2 * thickness, 2)
    
    def concrete_volume(
        self,
        area_m2: float,
        thickness: float = 0.1,
        waste_factor: float = 1.05
    ) -> float:
        """
        Calculate concrete volume with waste factor.
        
        Standard waste factor is 5% (1.05).
        """
        return round(area_m2 * thickness * waste_factor, 2)

    # ── Soil & material weight ───────────────────────────────────────────────

    # Bulk soil density (kg/m³) — СНиП 2.02.01-83
    SOIL_DENSITY = {
        "sand":       1600,
        "clay":       1800,
        "loam":       1700,
        "gravel":     1900,
        "rock":       2500,
        "topsoil":    1300,
        "concrete":   2400,
        "asphalt":    2300,
        "default":    1650,
    }

    def material_weight_estimate(
        self,
        volume_m3: float,
        material: str = "default",
    ) -> Dict[str, Any]:
        """
        Estimate weight of excavated/filled material.

        Args:
            volume_m3: Volume in cubic meters
            material:  Soil/material type

        Returns:
            {"weight_kg", "weight_tonnes", "material", "density_kg_m3", "trucks_10t"}
        """
        density = self.SOIL_DENSITY.get(material.lower(), self.SOIL_DENSITY["default"])
        weight_kg = volume_m3 * density
        tonnes = weight_kg / 1000

        return {
            "weight_kg": round(weight_kg, 1),
            "weight_tonnes": round(tonnes, 2),
            "material": material,
            "density_kg_m3": density,
            "trucks_10t": math.ceil(tonnes / 10),
        }

    def volume_breakdown(
        self,
        object_type: str,
        width_m: float,
        height_m: float,
        depth_m: float = None,
        soil_type: str = "default",
        pipe_diameter: float = 0.15,
    ) -> Dict[str, Any]:
        """
        Full volume breakdown: excavation, backfill, leftover, weight.

        Returns:
            {
                "excavation_m3": total dig volume,
                "backfill_m3":   material to put back,
                "leftover_m3":   material to dispose,
                "weight":        material_weight_estimate for leftover,
                "object_type":   str,
            }
        """
        d = depth_m or 1.0

        if object_type == "trench":
            exc = self.trench_volume(length=height_m, width=width_m, depth=d, soil_type=soil_type)
            exc_val = exc if isinstance(exc, (int, float)) else sum(v for v in exc.values() if isinstance(v, (int, float)))
            # Foundation occupies ~20% of trench volume
            structure_vol = exc_val * 0.20
            backfill = exc_val * 0.60
            leftover = exc_val - structure_vol - backfill

        elif object_type.startswith("pipe"):
            pt = self.pipe_trench_volume(pipe_length=max(width_m, height_m), pipe_diameter=pipe_diameter, trench_depth=d)
            exc_val = pt["trench_excavation_m3"]
            backfill = pt["backfill_m3"]
            leftover = exc_val - backfill - pt["pipe_bedding_m3"]

        elif object_type == "pit":
            exc_val = self.pit_volume(length=height_m, width=width_m, depth=d)
            backfill = exc_val * 0.30
            leftover = exc_val * 0.70

        elif object_type == "foundation":
            exc_val = self.pit_volume(length=height_m, width=width_m, depth=d)
            foundation_vol = self.foundation_volume(length=height_m, width=width_m, depth=d)
            backfill = exc_val - foundation_vol
            leftover = foundation_vol * 0.05  # ~5% leftover

        else:
            exc_val = width_m * height_m * d
            backfill = exc_val * 0.50
            leftover = exc_val * 0.50

        leftover = max(0, leftover)
        weight = self.material_weight_estimate(leftover, soil_type)

        return {
            "excavation_m3": round(exc_val, 2),
            "backfill_m3": round(max(0, backfill), 2),
            "leftover_m3": round(leftover, 2),
            "weight": weight,
            "object_type": object_type,
        }
