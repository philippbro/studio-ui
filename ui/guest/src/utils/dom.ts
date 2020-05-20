/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { fromEvent, interval, Subscription } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { forEach } from './array';
import {
  Coordinates,
  DropMarkerPosition,
  DropMarkerPositionArgs,
  InRectStats
} from '../models/Positioning';
import $ from 'jquery';
import { LookupTable } from '@craftercms/studio-ui/models/LookupTable';
import { RenderTree } from '../models/ContentTree';
import {
  DropZone,
  ElementRecord,
  HighlightData,
  ICERecord,
  ValidationResult
} from '../models/InContextEditing';
import ElementRegistry from '../classes/ElementRegistry';
import { HORIZONTAL, TOLERANCE_PERCENTS, VERTICAL, X_AXIS, Y_AXIS } from './util';
import { CSSProperties } from 'react';
import { ContentTypeReceptacle } from '@craftercms/studio-ui/models/ContentTypeReceptacle';

// Regular click gets triggered even after loooong mouse downs or
// when mousing-down and dragging cursor - without actually being on
// a drag and drop of an element - and then mousing-up some other place.
// This causes the ice zone selection to occur and the UX feels awkward.
// This is a custom click event with a more opinionated click behaviour
// that could be used instead of the regular click. The trade-of is that,
// as is, won't handle preventDefault/stopPropagation correctly as it's a
// delegate on the document (i.e. the event as bubbled all the way up).
// Would need to add additional logic to set the delegation in a way that
// events can still be stopped (see jQuery).
// export function addClickListener(
//   element: HTMLElement | Document,
//   type: string,
//   handler: (e: Event) => any
// ): Subscription {
//   if (element === document) {
//     // TODO: set up as delegate, control event propagation & stopping accordingly
//   }
//
//   const mouseDown$ = fromEvent(element, 'mousedown');
//   const mouseUp$ = fromEvent(element, 'mouseup');
//   return mouseDown$
//     .pipe(
//       switchMap(() => mouseUp$.pipe(takeUntil(interval(300)), take(1))),
//       filter(
//         (e: any) =>
//           e.target.hasAttribute('data-craftercms-model-id') ||
//           forEach(
//             e.path,
//             (el) =>
//               el !== window && el !== document && el.hasAttribute('data-craftercms-model-id')
//                 ? true
//                 : 'continue',
//             false
//           )
//       )
//     )
//     .subscribe(handler);
// }

export function sibling(element: HTMLElement, next: boolean): Element {
  return next ? element.nextElementSibling : element.previousElementSibling;
}

export function getDropMarkerPosition(args: DropMarkerPositionArgs): DropMarkerPosition {
  const {
      // refElement,
      arrangement,
      insertPosition,
      refElementRect,
      nextOrPrevRect
    } = args,
    horizontal = arrangement === HORIZONTAL,
    before = insertPosition === 'before',
    // $elementToInsert = $(refElement),

    // This vars are just for mental clarity; to work with
    // the right semantics in the code below.
    // If inserting before the element, will be working with
    // the previous element's rect (prev rect). If inserting
    // after, will be working with the next element's rect.
    nextRect = nextOrPrevRect,
    prevRect = nextOrPrevRect;

  // If there is not next/prev rect, no need to account for it
  // in the position calculation - set difference to 0.
  const difference = !nextOrPrevRect
    ? 0
    : // Account for whether the previous rect inline with current rect...
    // Only matters when working with horizontally laid-out elements
    horizontal && nextOrPrevRect.top !== refElementRect.top
    ? 0
    : // Calculate the middle point between the two adjacent rects.
    // This avoids the drop marker moving by millimeters when switching from
    // inserting after nodes[i] to before node[i+1]
    before
    ? // Inserting before
      horizontal
      ? // Smaller number fronted to obtain a negative
        // value since wish to subtract from the position
        (prevRect.right - refElementRect.left) / 2
      : (prevRect.bottom - refElementRect.top) / 2
    : // Inserting after
    horizontal
    ? // Bigger number fronted to obtain a positive
      // value to add to the position
      (nextRect.left - refElementRect.right) / 2
    : (nextRect.top - refElementRect.bottom) / 2;

  return horizontal
    ? {
        height: refElementRect.height,
        top: refElementRect.top,
        left: before ? refElementRect.left + difference : refElementRect.right + difference
      }
    : {
        width: refElementRect.width,
        top: before ? refElementRect.top + difference : refElementRect.bottom + difference,
        left: refElementRect.left
      };
}

export function splitRect(rect: DOMRect, axis: string = X_AXIS): DOMRect[] {
  // x, y, width, height, top, right, bottom, left
  let rect1: any = {},
    rect2: any = {};

  // noinspection DuplicatedCode
  if (axis === X_AXIS) {
    const half = rect.height / 2;

    rect1.x = rect.x;
    rect1.y = rect.y;
    rect1.width = rect.width;
    rect1.height = half;
    rect1.top = rect.top;
    rect1.right = rect.right;
    rect1.bottom = rect.top + half;
    rect1.left = rect.left;

    rect2.x = rect.x;
    rect2.y = rect.y + half;
    rect2.width = rect.width;
    rect2.height = half;
    rect2.top = rect2.y;
    rect2.right = rect.right;
    rect2.bottom = rect.bottom;
    rect2.left = rect.left;
  } else if (axis === Y_AXIS) {
    const half = rect.width / 2;

    rect1.x = rect.x;
    rect1.y = rect.y;
    rect1.width = half;
    rect1.height = rect.height;
    rect1.top = rect.top;
    rect1.right = rect.left + half;
    rect1.bottom = rect.bottom;
    rect1.left = rect.left;

    rect2.x = rect.x + half;
    rect2.y = rect.y;
    rect2.width = half;
    rect2.height = rect.height;
    rect2.top = rect.top;
    rect2.right = rect.right;
    rect2.bottom = rect.bottom;
    rect2.left = rect.left + half;
  } else {
    throw new Error(`Invalid axis suplied. Valid values are "${X_AXIS}" or "${Y_AXIS}".`);
  }
  return [rect1, rect2];
}

export function insertDropMarker({
  $dropMarker,
  insertPosition,
  refElement
}: {
  $dropMarker: JQuery<any>;
  insertPosition: string;
  refElement: HTMLElement | JQuery | string;
}): void {
  if (insertPosition === 'after') {
    $dropMarker.insertAfter(refElement);
  } else {
    $dropMarker.insertBefore(refElement);
  }
}

export function getDistanceBetweenPoints(p1: Coordinates, p2: Coordinates): number {
  const div = document.createElement('div');

  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function findClosestRect(
  parentRect: DOMRect,
  subRects: DOMRect[],
  coordinates: Coordinates
): number {
  let //
    index = -1,
    distances = [];

  subRects.forEach((rect, i) => {
    const stats = getInRectStats(rect, coordinates);

    stats.inRect && (index = i);

    distances.push(
      getDistanceBetweenPoints(coordinates, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    );

    return stats;
  });

  if (index === -1) {
    index = distances.indexOf(Math.min(...distances));
  }

  return index;
}

export function getChildArrangement(
  children: Element[],
  childrenRects: DOMRect[],
  selfRect?: DOMRect
): string {
  if (children.length === 0) {
    // If width is big enough, we may assume it may potentially have multiple
    // columns and HORIZONTAL arrangement may be better guess; however,
    // using the larger space to display the drop marker makes it more visible.
    // Vertical arrangement (stacked), will cause the drop marker to be across
    // the X axis, so logic is sort of flipped in the sense that it's said to be
    // vertical so that drop marker displays horizontally
    return selfRect.width > selfRect.height ? VERTICAL : HORIZONTAL;
  }

  let //
    topValues = [],
    alignedTop = false;

  for (let i = 0, l = children.length, topValue, marginTop; i < l; i++) {
    marginTop = parseInt(
      // jQuery is kind enough to always provide the value in pixels :)
      $(children[i])
        .css('margin-top')
        .replace(/px/i, '') || '',
      10
    );

    topValue = childrenRects[i].top - marginTop;

    if (topValues.includes(topValue)) {
      alignedTop = true;
      break;
    } else {
      topValues.push(topValue);
    }
  }

  return alignedTop ? HORIZONTAL : VERTICAL;
}

export function getInRectStats(
  rect: DOMRect,
  coordinates: Coordinates,
  tolerancePercents: Coordinates = TOLERANCE_PERCENTS
): InRectStats {
  const percents = getRelativePointerPositionPercentages(coordinates, rect),
    inRectTop = coordinates.y >= rect.top,
    inRectRight = coordinates.x <= rect.right,
    inRectBottom = coordinates.y <= rect.bottom,
    inRectLeft = coordinates.x >= rect.left,
    inRect = inRectLeft && inRectRight && inRectTop && inRectBottom,
    inInnerRectTop = percents.y >= tolerancePercents.y,
    inInnerRectRight = percents.x <= 100 - tolerancePercents.x,
    inInnerRectBottom = percents.y <= 100 - tolerancePercents.y,
    inInnerRectLeft = percents.x >= tolerancePercents.x,
    inInnerRect =
      inInnerRectLeft && // left
      inInnerRectRight && // right
      inInnerRectTop && // top
      inInnerRectBottom; // bottom

  return {
    inRectTop,
    inRectRight,
    inRectBottom,
    inRectLeft,
    inRect,
    inInnerRectTop,
    inInnerRectRight,
    inInnerRectBottom,
    inInnerRectLeft,
    inInnerRect,
    percents
  };
}

export function getRelativePointerPositionPercentages(mousePosition: Coordinates, rect: DOMRect): Coordinates {

  const
    x = (
      (
        /* mouse X distance from rect left edge */
        (mousePosition.x - rect.left) /
        /* width */
        rect.width
      ) * 100
    ),
    y = (
      (
        /* mouse X distance from rect top edge */
        (mousePosition.y - rect.top) /
        /* height */
        (rect.height)
      ) * 100
    );

  return { x, y };
}

export function isElementInView(element: Element | JQuery, fullyInView?: boolean): boolean {
  const pageTop = $(window).scrollTop();
  const pageBottom = pageTop + $(window).height();
  const elementTop = $(element).offset().top;
  const elementBottom = elementTop + $(element).height();

  if (fullyInView === true) {
    return pageTop < elementTop && pageBottom > elementBottom;
  } else {
    return elementTop <= pageBottom && elementBottom >= pageTop;
  }
}

export function addAnimation(
  $element: JQuery<Element> | JQuery<HTMLElement>,
  animationClass: string
): void {
  const END_EVENT = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
  $element.addClass(animationClass);
  // @ts-ignore
  $element.one(END_EVENT, function() {
    $element.removeClass(animationClass);
  });
}

export function scrollToNode(node: RenderTree, scrollElement: string): void {
  let $element: JQuery;
  if (node.index !== undefined) {
    $element = $(
      `[data-craftercms-model-id="${node.parentId || node.modelId}"][data-craftercms-field-id="${
        node.fieldId
      }"][data-craftercms-index="${node.index}"]`
    );
  } else {
    $element = $(
      `[data-craftercms-model-id="${node.modelId}"][data-craftercms-field-id="${node.fieldId}"]:not([data-craftercms-index])`
    );
  }
  if ($element.length) {
    if (!isElementInView($element)) {
      $(scrollElement).animate(
        {
          scrollTop: $element.offset().top - 100
        },
        300,
        function() {
          addAnimation($element, 'craftercms-contentTree-pulse');
        }
      );
    } else {
      addAnimation($element, 'craftercms-contentTree-pulse');
    }
  }
}

export function scrollToReceptacle(
  receptacles: ContentTypeReceptacle[],
  scrollElement: string,
  getElementRegistry: (id: number) => Element
) {
  let elementInView: boolean;
  let element: Element;
  elementInView = forEach(
    receptacles,
    ({ id }) => {
      let elem = getElementRegistry(id);
      if (isElementInView(elem)) {
        elementInView = true;
        element = elem;
        return 'break';
      }
    },
    false
  );

  if (!elementInView) {
    // TODO: Do this relative to the scroll position. Don't move if things are already in viewport. Be smarter.
    let element = getElementRegistry(receptacles[0].id);
    $(scrollElement).animate(
      {
        scrollTop: $(element).offset().top - 100
      },
      300
    );
  }
}

export function getHighlighted(dropZones: DropZone[]): LookupTable<HighlightData> {
  return dropZones.reduce((object, { physicalRecordId: id, validations }) => {
    object[id] = ElementRegistry.getHoverData(id);
    object[id].validations = validations;
    return object;
  }, {} as LookupTable<HighlightData>);
}

export function getDragContextFromReceptacles(
  receptacles: ICERecord[],
  validationsLookup?: LookupTable<LookupTable<ValidationResult>>,
  currentRecord?: ElementRecord
): { dropZones: any; siblings: any; players: any; containers: any; } {
  const response = {
    dropZones: [],
    siblings: [],
    players: [],
    containers: []
  };
  receptacles.forEach(({ id }) => {
    const dropZone = ElementRegistry.compileDropZone(id);
    dropZone.origin = null;
    dropZone.origin = currentRecord ? dropZone.children.includes(currentRecord.element) : null;
    dropZone.validations = validationsLookup?.[id] ?? {};
    response.dropZones.push(dropZone);
    response.siblings = [...response.siblings, ...dropZone.children];
    response.players = [...response.players, ...dropZone.children, dropZone.element];
    response.containers.push(dropZone.element);
  });

  return response;
}

export function getZoneMarkerLabelStyle(rect: DOMRect): CSSProperties {
  const $body = $('body');
  return ((rect.top + $body.scrollTop()) <= 0) ? {
    top: 0,
    left: '50%',
    marginLeft: -60,
    position: 'fixed'
  } : {};
}

export function getZoneMarkerStyle(rect: DOMRect, padding: number = 0): CSSProperties {
  const $window = $(window);
  return {
    height: rect.height + padding,
    width: rect.width + padding,
    top: (
      rect.top +
      $window.scrollTop() -
      (padding / 2)
    ),
    left: (
      rect.left +
      $window.scrollLeft() -
      (padding / 2)
    )
  };
}